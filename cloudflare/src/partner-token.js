// TikTok Shop PARTNER OAuth token rotation — runs entirely in Cloudflare Worker.
// Never expose secrets/tokens to browser, logs, analytics or API status response.
export const REFRESH_BEFORE_SECONDS = 30 * 60;
const MIN_RETRY_SECONDS = 15 * 60;
const MAX_RETRY_SECONDS = 6 * 60 * 60;
const PROVIDER_URL = 'https://auth.tiktok-shops.com/api/v2/token/refresh';

function nowSec() { return Math.floor(Date.now() / 1000); }
function safeErrorCode(code) { return String(code || 'TOKEN_REFRESH_FAILED').slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '_'); }
export function normalizeExpiry(raw, now = nowSec()) {
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  // TikTok Shop access_token_expire_in usually returns Unix seconds, not TTL.
  if (n >= 1_000_000_000) return n;
  return now + n; // support an API that actually supplies TTL in seconds
}
export function isRefreshDue(row, now = nowSec()) {
  if (!row || !row.access_token_encrypted || !row.access_expires_at) return true;
  return Number(row.access_expires_at) - now <= REFRESH_BEFORE_SECONDS;
}
function getKeyBytes(raw) {
  if (!raw) throw new Error('ENCRYPTION_KEY_MISSING');
  const bytes = Uint8Array.from(atob(raw), c=>c.charCodeAt(0));
  if (bytes.byteLength !== 32) throw new Error('ENCRYPTION_KEY_INVALID');
  return bytes;
}
async function aesKey(env) {
  return crypto.subtle.importKey('raw', getKeyBytes(env.PARTNER_TOKEN_ENCRYPTION_KEY), { name:'AES-GCM' }, false, ['encrypt','decrypt']);
}
export async function encryptToken(raw, env) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv}, await aesKey(env), new TextEncoder().encode(raw)));
  const out=new Uint8Array(iv.length+ciphertext.length); out.set(iv);out.set(ciphertext,iv.length);
  return btoa(String.fromCharCode(...out));
}
export async function decryptToken(cipher, env) {
  const raw=Uint8Array.from(atob(cipher), c=>c.charCodeAt(0));
  if(raw.length<29)throw new Error('ENCRYPTED_TOKEN_INVALID');
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12)}, await aesKey(env), raw.slice(12));
  return new TextDecoder().decode(clear);
}
function configured(env){return Boolean(env.DB && env.PARTNER_APP_KEY && env.PARTNER_APP_SECRET && env.PARTNER_TOKEN_ENCRYPTION_KEY);}
async function readRow(env){
  return env.DB.prepare('SELECT * FROM partner_oauth_tokens WHERE id = ?').bind('partner').first();
}
// Response for Admin ONLY. Credentials and raw TikTok errors are intentionally never returned.
export async function getPartnerTokenStatus(env) {
  if(!configured(env))return {configured:false,status:'not_configured',automated:false,refresh_interval_minutes:15};
  const row=await readRow(env);
  const now=nowSec();
  return {
    configured:true,
    automated:true,
    status: row?.status || 'awaiting_initial_authorization',
    last_success_at: row?.last_success_at || null,
    last_attempt_at: row?.last_attempt_at || null,
    access_expires_at: row?.access_expires_at || null,
    refresh_expires_at: row?.refresh_expires_at || null,
    next_refresh_at: row?.access_expires_at ? Math.max(now, row.access_expires_at - REFRESH_BEFORE_SECONDS) : (row?.retry_after || null),
    expires_in_seconds: row?.access_expires_at ? Math.max(0, row.access_expires_at - now) : null,
    needs_reauthorization: row?.status === 'reauthorization_required',
    // Failure code from constrained enum only; no secrets, tokens or request payloads.
    last_error_code: row?.last_error_code || null,
    refresh_interval_minutes:15
  };
}
function backoff(failureCount){return Math.min(MAX_RETRY_SECONDS, MIN_RETRY_SECONDS * 2**Math.min(5,Math.max(0,failureCount-1)));}

/**
 * `force` is an authenticated Admin manual refresh. Scheduled job uses force=false.
 * A D1 lease prevents concurrent cron/request invocations from using the same one-time rotating refresh token.
 */
export async function refreshPartnerToken(env, {force=false, fetcher=fetch}={}) {
  if(!configured(env))return {ok:false,reason:'not_configured'};
  const now=nowSec();
  await env.DB.prepare("INSERT OR IGNORE INTO partner_oauth_tokens (id,status) VALUES ('partner','awaiting_initial_authorization')").run();
  const row=await readRow(env);
  if(!force && row.status==='reauthorization_required')return {ok:false,reason:'reauthorization_required'};
  if(!force && row.retry_after && row.retry_after>now)return {ok:false,reason:'waiting_for_retry'};
  if(!force && !isRefreshDue(row, now))return {ok:true,reason:'not_due'};
  if(row.refresh_expires_at && row.refresh_expires_at<=now){
    await env.DB.prepare("UPDATE partner_oauth_tokens SET status='reauthorization_required',last_error_code='REFRESH_TOKEN_EXPIRED' WHERE id='partner'").run();
    return {ok:false,reason:'reauthorization_required'};
  }
  // Claim only if lease expired. This conditional UPDATE is atomic within D1.
  const lock=await env.DB.prepare("UPDATE partner_oauth_tokens SET lease_until=?, last_attempt_at=? WHERE id='partner' AND lease_until<?")
    .bind(now+100,now,now).run();
  if(lock.meta?.changes!==1)return {ok:false,reason:'already_running'};
  try {
    const latest=await readRow(env);
    const refresh=latest.refresh_token_encrypted
      ? await decryptToken(latest.refresh_token_encrypted,env)
      : env.PARTNER_INITIAL_REFRESH_TOKEN;
    if(!refresh){
      await env.DB.prepare("UPDATE partner_oauth_tokens SET status='awaiting_initial_authorization',lease_until=0 WHERE id='partner'").run();
      return {ok:false,reason:'awaiting_initial_authorization'};
    }
    const url=new URL(PROVIDER_URL);
    url.searchParams.set('app_key',env.PARTNER_APP_KEY);
    url.searchParams.set('app_secret',env.PARTNER_APP_SECRET);
    url.searchParams.set('refresh_token',refresh);
    url.searchParams.set('grant_type','refresh_token');
    // TikTok Shop auth API explicitly documents GET. Do not log the URL (contains credentials).
    const res=await fetcher(url.toString(), {method:'GET',headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});
    if(!res.ok)throw new Error(res.status===429?'RATE_LIMITED':'PROVIDER_HTTP_ERROR');
    const payload=await res.json();
    if(payload?.code===36009002)throw new Error('RATE_LIMITED');
    if(payload?.code!==0 || !payload?.data?.access_token)throw new Error('TIKTOK_AUTH_REJECTED');
    const data=payload.data;
    const accessExpiry=normalizeExpiry(data.access_token_expire_in,now);
    const refreshExpiry=normalizeExpiry(data.refresh_token_expire_in,now);
    if(!accessExpiry || accessExpiry<=now)throw new Error('TOKEN_EXPIRY_INVALID');
    if(data.open_id && latest.open_id && data.open_id!==latest.open_id)throw new Error('PARTNER_IDENTITY_CHANGED');
    if(data.user_type!=null && latest.user_type!=null && String(data.user_type)!==String(latest.user_type))throw new Error('PARTNER_USER_TYPE_CHANGED');
    // When bootstrap via a Partner token, reject seller/creator identity, unless TikTok changes the documented values.
    if(data.user_type!=null && ![2,3].includes(Number(data.user_type)))throw new Error('TOKEN_NOT_PARTNER');
    const nextRefresh=data.refresh_token || refresh;
    const encryptedAccess=await encryptToken(data.access_token, env);
    const encryptedRefresh=await encryptToken(nextRefresh, env);
    await env.DB.prepare(`UPDATE partner_oauth_tokens SET
      access_token_encrypted=?,refresh_token_encrypted=?,access_expires_at=?,refresh_expires_at=?,
      open_id=?,user_type=?,granted_scopes=?,last_success_at=?,status='active',last_error_code=NULL,
      retry_after=NULL,failure_count=0,lease_until=0 WHERE id='partner'`)
      .bind(encryptedAccess,encryptedRefresh,accessExpiry,refreshExpiry || latest.refresh_expires_at || null,
        data.open_id || latest.open_id || null,
        data.user_type==null ? latest.user_type || null : Number(data.user_type),
        JSON.stringify(data.granted_scopes || []),now).run();
    return {ok:true,reason:'refreshed',access_expires_at:accessExpiry};
  } catch(error){
    // No error.message from external source is persisted; whitelist internal codes only.
    const allowed=new Set(['RATE_LIMITED','PROVIDER_HTTP_ERROR','TIKTOK_AUTH_REJECTED','TOKEN_EXPIRY_INVALID','PARTNER_IDENTITY_CHANGED','PARTNER_USER_TYPE_CHANGED','TOKEN_NOT_PARTNER','ENCRYPTION_KEY_MISSING','ENCRYPTION_KEY_INVALID','ENCRYPTED_TOKEN_INVALID']);
    const safe=allowed.has(error.message)?error.message:'REFRESH_REQUEST_FAILED';
    const failures=(Number(row.failure_count)||0)+1;
    const next=now+backoff(failures);
    const needsAuth=['PARTNER_IDENTITY_CHANGED','PARTNER_USER_TYPE_CHANGED','TOKEN_NOT_PARTNER'].includes(safe);
    await env.DB.prepare('UPDATE partner_oauth_tokens SET status=?,last_error_code=?,retry_after=?,failure_count=?,lease_until=0 WHERE id=?')
      .bind(needsAuth?'reauthorization_required':'retry_scheduled',safe,needsAuth?null:next,failures,'partner').run();
    return {ok:false,reason:needsAuth?'reauthorization_required':'retry_scheduled'};
  }
}
