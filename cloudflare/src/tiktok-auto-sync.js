// Server-only TikTok Shop synchronizer. Fails closed for missing scopes, ambiguous
// metric/currency identity, pagination or authorization. Never invent GMV.
import { encryptToken, decryptToken, normalizeExpiry } from './partner-token.js';
import {importBatch} from './sync-pipeline.js';
const HANDLES=['shopkhangbaby','mekhangsua'];
const AUTH='https://auth.tiktok-shops.com/api/v2/token/refresh';
const API='https://open-api.tiktokglobalshop.com';
const LIVE_PATH='/analytics/202509/shop_lives/performance';
const DUE_SECONDS=30*60;
const nowSec=()=>Math.floor(Date.now()/1000);
function configurations(env){
  if(!env.DB||!env.SELLER_APP_KEY||!env.SELLER_APP_SECRET||!env.PARTNER_TOKEN_ENCRYPTION_KEY)return null;
  // Bootstrap strings are intended to be stored as a Cloudflare secret, never frontend.
  try{
    const parsed=JSON.parse(env.SELLER_REFRESH_TOKENS_JSON||'{}');
    if(!parsed || typeof parsed!=='object' || Object.keys(parsed).some(k=>!HANDLES.includes(k)))return null;
    return parsed;
  }catch{return null;}
}
async function row(env,handle){return env.DB.prepare('SELECT * FROM seller_oauth_tokens WHERE username=?').bind(handle).first();}
export async function sellerRefresh(env,handle,{fetcher=fetch,force=false}={}){
  if(!HANDLES.includes(handle))return {ok:false,reason:'unknown_channel'};
  const bootstrap=configurations(env);
  if(!bootstrap)return {ok:false,reason:'not_configured'};
  const now=nowSec();
  await env.DB.prepare('INSERT OR IGNORE INTO seller_oauth_tokens(username,status) VALUES (?,?)').bind(handle,'awaiting_initial_authorization').run();
  let r=await row(env,handle);
  if(!force && r.retry_after && Number(r.retry_after)>now)return {ok:false,reason:'waiting_for_retry'};
  if(r.status==='reauthorization_required')return {ok:false,reason:'reauthorization_required'};
  if(!force && r.access_token_encrypted && Number(r.access_expires_at)-now>DUE_SECONDS)return {ok:true,reason:'not_due'};
  if(r.refresh_expires_at && Number(r.refresh_expires_at)<=now)return {ok:false,reason:'reauthorization_required'};
  const lock=await env.DB.prepare('UPDATE seller_oauth_tokens SET lease_until=? WHERE username=? AND lease_until<?').bind(now+90,handle,now).run();
  if(lock.meta?.changes!==1)return {ok:false,reason:'already_running'};
  try{
    r=await row(env,handle);
    const secret=r.refresh_token_encrypted?await decryptToken(r.refresh_token_encrypted,env):bootstrap[handle];
    if(!secret)throw new Error('awaiting_initial_authorization');
    const u=new URL(AUTH);
    for(const [k,v] of Object.entries({app_key:env.SELLER_APP_KEY,app_secret:env.SELLER_APP_SECRET,refresh_token:secret,grant_type:'refresh_token'}))u.searchParams.set(k,v);
    const response=await fetcher(u.toString(),{method:'GET',headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('provider_http_error');
    const payload=await response.json();
    if(payload.code!==0||!payload.data?.access_token||!payload.data.refresh_token)throw new Error('token_rejected');
    const d=payload.data;
    // user_type=0 is seller-owned shop authorization. Partner tokens cannot access Seller APIs.
    if(d.user_type!==undefined && Number(d.user_type)!==0)throw new Error('wrong_token_type');
    if(r.open_id && d.open_id && d.open_id!==r.open_id)throw new Error('identity_changed');
    const expires=normalizeExpiry(d.access_token_expire_in,now);
    const refreshExp=normalizeExpiry(d.refresh_token_expire_in,now);
    if(!expires||expires<=now)throw new Error('bad_expiry');
    const access=await encryptToken(d.access_token,env);
    const refresh=await encryptToken(d.refresh_token,env);
    await env.DB.prepare(`UPDATE seller_oauth_tokens SET access_token_encrypted=?,refresh_token_encrypted=?,access_expires_at=?,refresh_expires_at=?,open_id=?,status='active',last_error_code=NULL,retry_after=NULL,failures=0,last_refresh_at=?,lease_until=0 WHERE username=?`)
      .bind(access,refresh,expires,refreshExp||r.refresh_expires_at||null,d.open_id||r.open_id||null,now,handle).run();
    return {ok:true,reason:'refreshed'};
  }catch(error){
    const code=['awaiting_initial_authorization','provider_http_error','token_rejected','wrong_token_type','identity_changed','bad_expiry'].includes(error.message)?error.message:'refresh_error';
    const fatal=['wrong_token_type','identity_changed','token_rejected'].includes(code);
    const fails=Number(r.failures||0)+1;
    await env.DB.prepare(`UPDATE seller_oauth_tokens SET status=?,last_error_code=?,retry_after=?,failures=?,lease_until=0 WHERE username=?`)
      .bind(fatal?'reauthorization_required':code==='awaiting_initial_authorization'?code:'retry_scheduled',code,fatal?null:now+Math.min(6*3600,900*2**Math.min(5,fails-1)),fails,handle).run();
    return {ok:false,reason:code};
  }
}
async function token(env,handle){const r=await row(env,handle);if(!r?.access_token_encrypted||Number(r.access_expires_at)<nowSec()+120)return null;return decryptToken(r.access_token_encrypted,env);}
// TikTok Shop GET signature: app_secret + path + sorted query (excluding sign/access_token) + app_secret.
export async function signGet(path,params,secret){
  const str=secret+path+Object.entries(params).filter(([k])=>k!=='sign'&&k!=='access_token').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+v).join('')+secret;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(str)));
  return Array.from(signature,b=>b.toString(16).padStart(2,'0')).join('');
}
function moneyVnd(v){
  // Do not guess cents to VND: only exact integral VND values are accepted.
  if(v&&typeof v==='object'){
    if(v.currency!=='VND')return null;
    v=v.amount;
  }
  const n=Number(v);
  return Number.isSafeInteger(n)&&n>=0?n:null;
}
export function mapLiveSession(record,handle){
  if(!record||typeof record!=='object')return null;
  // LIVE attribution must be explicit and tied to one of our two allowed accounts.
  const candidate=String(record.creator_username||record.account_username||record.channel_username||'').replace(/^@/,'').toLowerCase();
  if(candidate!==handle)return null;
  const session=String(record.live_room_id||record.live_id||record.session_id||'');
  const start=record.start_time||record.started_at;
  const stamp=typeof start==='number'||/^\d{10,13}$/.test(String(start))?new Date(Number(start)*(String(start).length===13?1:1000)):new Date(start);
  const gross=moneyVnd(record.gmv||record.local_gmv||record.gross_gmv_vnd);
  const units=record.items_sold??record.sold_units;
  const orders=units==null?NaN:Number(units);
  if(!session||!Number.isFinite(stamp.getTime())||gross===null||!Number.isSafeInteger(orders)||orders<0)return null;
  const refunded=moneyVnd(record.canceled_refunded_vnd??0);
  if(refunded===null||refunded>gross)return null;
  return {session_id:session,channel_username:handle,title:String(record.title||record.live_title||'LIVE').slice(0,300),host_name:'',started_at:stamp.toISOString(),ended_at:null,gross_gmv_vnd:gross,canceled_refunded_vnd:refunded,net_gmv_vnd:gross-refunded,sold_units:orders,net_units:orders,source_updated_at:new Date().toISOString()};
}
export async function pullSellerLives(env,handle,{fetcher=fetch}={}){
  const cred=configurations(env);
  if(!cred)return {status:'not_configured'};
  const access=await token(env,handle);
  if(!access)return {status:'awaiting_authorization'};
  // TikTok Analytics requires the approved shop_analytics scope and seller shop authorization.
  // Shop cipher must match the authorized TikTok shop, never guessed from username.
  const cipher=env[`SELLER_SHOP_CIPHER_${handle.toUpperCase()}`];
  if(!cipher)return {status:'shop_cipher_missing'};
  // Single recent-day window avoids unbounded requests on free Cloudflare plans.
  // Use shop's configured timezone to build YYYY-MM-DD; never blindly use UTC midnight.
  const timezone=env.SELLER_SHOP_TIMEZONE||'Asia/Ho_Chi_Minh';
  const d=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const utc=new Date(d+'T00:00:00Z');utc.setUTCDate(utc.getUTCDate()-2);
  const start=utc.toISOString().slice(0,10);
  const end=new Date(d+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);
  let cursor='',total=0;
  for(let i=0;i<5;i++){
    const params={app_key:env.SELLER_APP_KEY,timestamp:String(nowSec()),shop_cipher:cipher,start_date_ge:start,end_date_lt:end.toISOString().slice(0,10),page_size:'100'};
    if(cursor)params.page_token=cursor;
    const sign=await signGet(LIVE_PATH,params,env.SELLER_APP_SECRET);
    const uri=new URL(API+LIVE_PATH);for(const [k,v] of Object.entries({...params,sign}))uri.searchParams.set(k,v);
    const response=await fetcher(uri.toString(),{headers:{'content-type':'application/json','x-tts-access-token':access},redirect:'error',signal:AbortSignal.timeout(16000)});
    if(!response.ok)throw new Error('LIVE_API_HTTP_ERROR');
    const data=await response.json();
    if(data.code!==0)throw new Error('LIVE_API_NOT_AUTHORIZED_OR_BAD_RESPONSE');
    const list=data?.data?.live_sessions||data?.data?.shop_lives||data?.data?.items;
    if(!Array.isArray(list))throw new Error('LIVE_RESPONSE_SCHEMA_UNVERIFIED');
    const eligible=list.map(x=>mapLiveSession(x,handle)).filter(Boolean);
    // If an API field set is incompatible, avoid claiming a successful sync.
    if(list.length && !eligible.length)throw new Error('LIVE_RESPONSE_MISSING_REQUIRED_FIELDS');
    if(eligible.length){
      const batchKey=`auto-live-${handle}-${start}-${i}-${crypto.randomUUID()}`;
      await importBatch(env,'seller',eligible,batchKey);
      total+=eligible.length;
    }
    const next=data?.data?.next_page_token;
    if(!next||next===cursor)return {status:'success',processed:total};
    cursor=String(next);
  }
  return {status:'partial_pagination',processed:total};
}
export async function runTikTokAutoSync(env,{fetcher=fetch}={}){
  const output={};
  for(const handle of HANDLES){
    try{
      const refresh=await sellerRefresh(env,handle,{fetcher});
      if(!refresh.ok){output[handle]={status:refresh.reason};continue;}
      output[handle]=await pullSellerLives(env,handle,{fetcher});
    }catch(e){
      const safe=['LIVE_API_HTTP_ERROR','LIVE_API_NOT_AUTHORIZED_OR_BAD_RESPONSE','LIVE_RESPONSE_SCHEMA_UNVERIFIED','LIVE_RESPONSE_MISSING_REQUIRED_FIELDS'].includes(e.message)?e.message:'sync_failed';
      output[handle]={status:safe};
    }
  }
  return output;
}
export async function sellerTokenStatus(env){
  if(!configurations(env))return {configured:false,channels:[]};
  const channels=[];
  for(const handle of HANDLES){const r=await row(env,handle);channels.push({username:handle,status:r?.status||'awaiting_initial_authorization',last_refresh_at:r?.last_refresh_at||null,expires_at:r?.access_expires_at||null,last_error_code:r?.last_error_code||null});}
  return {configured:true,channels};
}
