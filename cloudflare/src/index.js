import { registerIdentity, reissueToken, listPending, approveToken } from './account-activation.js';
import { getPartnerTokenStatus, refreshPartnerToken } from './partner-token.js';
import {runTikTokAutoSync,sellerTokenStatus} from './tiktok-auto-sync.js';
import { SOURCES, importBatch, syncStatus, validateIngestKey } from './sync-pipeline.js';
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

async function verifyIdentity(request,env){
 if(!env.FIREBASE_PROJECT_ID||!env.DB)return {error:'Server chưa cấu hình Firebase/D1',status:503};
 const match=(request.headers.get('Authorization')||'').match(/^Bearer (.+)$/i);
 if(!match)return {error:'Thiếu Firebase ID token',status:401};
 try{
  const verified=await jwtVerify(match[1],jwks,{
   algorithms:['RS256'],issuer:`https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
   audience:env.FIREBASE_PROJECT_ID
  });
  const uid=verified.payload.sub;
  if(typeof uid!=='string'||!uid)return {error:'Firebase UID không hợp lệ',status:401};
  return {uid,email:typeof verified.payload.email==='string'?verified.payload.email:'',
    name:typeof verified.payload.name==='string'?verified.payload.name:'',emailVerified:verified.payload.email_verified===true};
 }catch{return {error:'Firebase ID token không hợp lệ hoặc hết hạn',status:401};}
}


async function requireUser(request,env){
 const identity=await verifyIdentity(request,env);
 if(identity.error)return identity;
 const member=await env.DB.prepare('SELECT firebase_uid, role, active FROM app_users WHERE firebase_uid=?').bind(identity.uid).first();
 if(!member||!member.active)return {error:'Tài khoản chưa được kích hoạt hoặc đã bị khóa',status:403};
 return {user:member,identity};
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const origin = request.headers.get('Origin');
    if (origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'Nguồn truy cập không được phép' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Phương thức không được hỗ trợ' }, 405, cors);
    const url = new URL(request.url);
    if (url.pathname === '/api/v1/health') return json({ ok: true, service: 'DATA SHOPKHANGBABY API', mode: 'live-backend', tiktok_connected: false }, 200, cors);
    // Import từ Cloud Shell / connector server. Không dùng Firebase browser token để import.
    const ingestMatch=url.pathname.match(/^\/api\/v1\/ingest\/(seller|orders)$/);
    if(ingestMatch){
      if(request.method!=='POST')return json({error:'Chỉ POST'},405,cors);
      // Không cho API key ingestion đi qua cross-site browser requests.
      if(origin)return json({error:'Chỉ cho phép kết nối từ backend / Cloud Shell'},403,cors);
      if(!await validateIngestKey(request,env))return json({error:'Ingest API key không hợp lệ'},401,cors);
      try{
        if(Number(request.headers.get('Content-Length')||0)>1024*1024)return json({error:'Payload vượt 1 MB'},413,cors);
        const raw=await request.text();
        if(new TextEncoder().encode(raw).byteLength>1024*1024)return json({error:'Payload vượt 1 MB'},413,cors);
        const data=JSON.parse(raw);
        return json(await importBatch(env,ingestMatch[1],data.items,data.batch_key),200,cors);
      }catch(error){
        const message=String(error?.message||'').slice(0,180);
        if(/SQLITE_CONSTRAINT|UNIQUE constraint/i.test(message))return json({error:'Batch đã được xử lý; gửi lại batch_key để kiểm tra'},409,cors);
        return json({error:message||'Dữ liệu nhập không hợp lệ'},400,cors);
      }
    }

// V69: first registration always provisions Viewer; token generated server-side, once.
if (url.pathname==='/api/v1/registration'||url.pathname==='/api/v1/registration/reissue') {
  if(request.method!=='POST')return json({error:'Chỉ POST'},405,cors);
  const identity=await verifyIdentity(request,env);
  if(identity.error)return json({error:identity.error},identity.status,cors);
  try {
    const data=url.pathname.endsWith('reissue')?
     await reissueToken(env.DB,identity):await registerIdentity(env.DB,identity);
    return json(data,200,cors);
  }catch(e){return json({error:String(e.message||'Lỗi đăng ký').slice(0,200)},400,cors);}
}
if(url.pathname==='/api/v1/activation-requests'||url.pathname==='/api/v1/activation-requests/approve'){
  const access=await requireUser(request,env);
  if(access.error)return json({error:access.error},access.status,cors);
  if(access.user.role!=='Admin')return json({error:'Chỉ quản trị viên được duyệt tài khoản'},403,cors);
  try{
   if(url.pathname.endsWith('/approve')){
     if(request.method!=='POST')return json({error:'Chỉ POST'},405,cors);
     const raw=await request.text();
     if(raw.length>2048)return json({error:'Dữ liệu vượt giới hạn'},413,cors);
     return json(await approveToken(env.DB,access.identity.uid,JSON.parse(raw)),200,cors);
   }
   if(request.method!=='GET')return json({error:'Chỉ GET'},405,cors);
   return json(await listPending(env.DB),200,cors);
  }catch(e){return json({error:String(e.message||'Lỗi kích hoạt').slice(0,200)},400,cors);}
}
    if (!['/api/v1/live-sessions', '/api/v1/sync/status', '/api/v1/me', '/api/v1/partner-token/status', '/api/v1/partner-token/refresh', '/api/v1/seller-token/status'].includes(url.pathname)) return json({ error: 'Không tìm thấy endpoint' }, 404, cors);
    try {
      const access = await requireUser(request, env);
      if (access.error) return json({ error: access.error }, access.status, cors);
      if(url.pathname==='/api/v1/me'){
        if(request.method!=='GET')return json({error:'Chỉ GET'},405,cors);
        const pending=await env.DB.prepare(`SELECT 1 AS pending FROM account_activation_requests WHERE firebase_uid=? AND status='pending'`).bind(access.user.firebase_uid).first();
        return json({uid:access.user.firebase_uid,email:access.identity.email,role:access.user.role,pendingActivation:!!pending},200,cors);
      }
      if(url.pathname==='/api/v1/sync/status'){
        if(request.method!=='GET')return json({error:'Chỉ GET'},405,cors);
        if(!['Admin','Ops'].includes(access.user.role))return json({error:'Không có quyền xem trạng thái đồng bộ'},403,cors);
        return json(await syncStatus(env),200,cors);
      }
      if (url.pathname==='/api/v1/seller-token/status'){
        if(access.user.role!=='Admin')return json({error:'Chỉ Admin'},403,cors);
        return json(await sellerTokenStatus(env),200,cors);
      }
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
    } catch (e) {
      console.error('API error:', e.message);
      return json({ error: 'Lỗi máy chủ. Kiểm tra cấu hình Worker/D1.' }, 500, cors);
    }
  },
  async scheduled(controller, env, ctx) {
    // Always runs independently of browsers; only refreshes when due.
    ctx.waitUntil(Promise.allSettled([refreshPartnerToken(env),runTikTokAutoSync(env)]));
  }
};
