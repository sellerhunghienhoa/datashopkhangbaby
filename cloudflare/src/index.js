import { getPartnerTokenStatus, refreshPartnerToken } from './partner-token.js';
// DATA SHOPKHANGBABY – Cloudflare Worker API starter.
// API dữ liệu D1 thật (mặc định rỗng). CHƯA có trình đồng bộ TikTok/OAuth.
import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwks = createRemoteJWKSet(new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
));
const ALLOWED_OFFICIAL = ['mekhangsua', 'shopkhangbaby'];

function json(body, status = 200, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors }
  });
}
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.FRONTEND_ORIGIN || '').split(',').map(v => v.trim()).filter(Boolean);
  return origin && allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
    : {};
}
function positiveInt(raw, fallback = 20, max = 100) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}
async function requireUser(request, env) {
  if (!env.FIREBASE_PROJECT_ID || !env.DB) throw new Error('Server chưa cấu hình Firebase/D1');
  const match = (request.headers.get('Authorization') || '').match(/^Bearer (.+)$/i);
  if (!match) return { error: 'Thiếu Firebase ID token', status: 401 };
  let verified;
  try {
    verified = await jwtVerify(match[1], jwks, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID
    });
  } catch { return { error: 'Firebase ID token không hợp lệ hoặc đã hết hạn', status: 401 }; }
  const uid = verified.payload.sub;
  if (typeof uid !== 'string' || !uid) return { error: 'Firebase UID không hợp lệ', status: 401 };
  const member = await env.DB.prepare('SELECT firebase_uid, role, active FROM app_users WHERE firebase_uid = ?').bind(uid).first();
  if (!member || !member.active) return { error: 'Tài khoản chưa được quản trị viên cấp quyền', status: 403 };
  return { user: member };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const origin = request.headers.get('Origin');
    if (origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'Nguồn truy cập không được phép' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Phương thức không được hỗ trợ' }, 405, cors);
    const url = new URL(request.url);
    if (url.pathname === '/api/v1/health') return json({ ok: true, service: 'DATA SHOPKHANGBABY API', mode: 'starter' }, 200, cors);
    if (!['/api/v1/live-sessions', '/api/v1/affiliate-sessions', '/api/v1/ads-campaigns', '/api/v1/partner-token/status', '/api/v1/partner-token/refresh'].includes(url.pathname)) return json({ error: 'Không tìm thấy endpoint' }, 404, cors);
    try {
      const access = await requireUser(request, env);
      if (access.error) return json({ error: access.error }, access.status, cors);
      if (url.pathname.startsWith('/api/v1/partner-token/')) {
        if (access.user.role !== 'Admin') return json({error:'Chỉ quản trị viên được quản lý trạng thái Partner'},403,cors);
        if (url.pathname.endsWith('/status')) {
          if (request.method !== 'GET') return json({error:'Method not allowed'},405,cors);
          return json(await getPartnerTokenStatus(env),200,cors);
        }
        if (request.method !== 'POST') return json({error:'Method not allowed'},405,cors);
        const result=await refreshPartnerToken(env,{force:true});
        return json({result:result.reason, status:await getPartnerTokenStatus(env)}, result.ok?200:409,cors);
      }
      if (request.method !== 'GET') return json({error:'Method not allowed'},405,cors);
      // Phân quyền bắt buộc ở backend: ẩn tab frontend không phải là biện pháp bảo mật.
      // Viewer/Host chỉ được đọc LIVE chính thức; báo cáo Affiliate và Ads cần Ops/Admin.
      if ((url.pathname === '/api/v1/affiliate-sessions' || url.pathname === '/api/v1/ads-campaigns')
          && !['Admin', 'Ops'].includes(access.user.role)) {
        return json({ error: 'Tài khoản không có quyền đọc nhóm dữ liệu này' }, 403, cors);
      }
      const limit = positiveInt(url.searchParams.get('limit'));
      const offset = (positiveInt(url.searchParams.get('page'), 1, 10000) - 1) * limit;
      if (url.pathname === '/api/v1/live-sessions') {
        const channel = url.searchParams.get('channel') || '';
        if (channel && !ALLOWED_OFFICIAL.includes(channel)) return json({ error: 'Kênh không được theo dõi' }, 400, cors);
        const sql = `SELECT session_id, channel_username, title, host_name, started_at, ended_at,
          gross_gmv_vnd, canceled_refunded_vnd, net_gmv_vnd, sold_units, net_units, reconciled_at
          FROM live_sessions WHERE channel_username IN ('mekhangsua','shopkhangbaby')
          ${channel ? 'AND channel_username = ?' : ''} ORDER BY started_at DESC LIMIT ? OFFSET ?`;
        const vals = channel ? [channel, limit, offset] : [limit, offset];
        const result = await env.DB.prepare(sql).bind(...vals).all();
        return json({ items: result.results || [], page: Math.floor(offset / limit) + 1, limit }, 200, cors);
      }
      if (url.pathname === '/api/v1/affiliate-sessions') {
        const result = await env.DB.prepare('SELECT session_id, creator_id, creator_handle, creator_name, started_at, gross_gmv_vnd, net_gmv_vnd, order_count, estimated_commission_vnd FROM affiliate_sessions ORDER BY started_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
        return json({ items: result.results || [], page: Math.floor(offset / limit) + 1, limit }, 200, cors);
      }
      const result = await env.DB.prepare('SELECT advertiser_id, campaign_id, campaign_name, report_date, spend_vnd, attributed_revenue_vnd, impressions, clicks, orders FROM ads_campaigns ORDER BY report_date DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
      return json({ items: result.results || [], page: Math.floor(offset / limit) + 1, limit }, 200, cors);
    } catch (e) {
      console.error('API error:', e.message);
      return json({ error: 'Lỗi máy chủ. Kiểm tra cấu hình Worker/D1.' }, 500, cors);
    }
  },
  async scheduled(controller, env, ctx) {
    // Always runs independently of browsers; only refreshes when due.
    ctx.waitUntil(refreshPartnerToken(env).catch(()=>{}));
  }
};
