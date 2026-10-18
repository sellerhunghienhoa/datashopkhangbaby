// V50 — import an toàn từ đồng bộ API phía server hoặc Cloud Shell.
// D1 lưu snapshot qua UPSERT; KHÔNG cộng dồn GMV khi nhập lại cùng bản ghi.
export const OFFICIAL_HANDLES = Object.freeze(['shopkhangbaby', 'mekhangsua']);
export const SOURCES = Object.freeze(['seller', 'affiliate', 'ads', 'orders']);
const nonblank = (v, name, max=128) => {
  if (typeof v !== 'string' && typeof v !== 'number') throw new Error(`${name} không hợp lệ`);
  const s=String(v).trim();
  if (!s || s.length>max) throw new Error(`${name} không hợp lệ`);
  return s;
};
const optional = (v,max=255) => v==null ? '' : String(v).slice(0,max);
const money = (v,name) => {
  const n=Number(v ?? 0);
  if(!Number.isSafeInteger(n)||n<0)throw new Error(`${name} phải là số nguyên không âm (VND)`);
  return n;
};
const iso=(v,name)=>{
  const s=nonblank(v,name,40);
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)||!Number.isFinite(Date.parse(s))) throw new Error(`${name} phải là ISO 8601 UTC`);
  return new Date(s).toISOString();
};
const optionalIso=v=>v ? iso(v,'source_updated_at') : null;
const onlyChannel=v=>{
  const handle=nonblank(v,'channel_username').replace(/^@/,'').toLowerCase();
  if(!OFFICIAL_HANDLES.includes(handle))throw new Error('Chỉ đồng bộ LIVE chính thức của 2 kênh đã đăng ký');
  return handle;
};
export function normalize(source,raw){
  if(!raw || typeof raw!=='object'||Array.isArray(raw))throw new Error('Dòng dữ liệu phải là object');
  if(source==='seller'){
    const gross=money(raw.gross_gmv_vnd,'gross_gmv_vnd');
    const refunded=money(raw.canceled_refunded_vnd,'canceled_refunded_vnd');
    if(refunded>gross)throw new Error('Hoàn/hủy vượt GMV ghi nhận');
    const net=raw.net_gmv_vnd==null?gross-refunded:money(raw.net_gmv_vnd,'net_gmv_vnd');
    if(net>gross)throw new Error('GMV sau hoàn/hủy vượt GMV đã ghi nhận');
    const sold=money(raw.sold_units,'sold_units');
    const netUnits=raw.net_units==null?sold:money(raw.net_units,'net_units');
    if(netUnits>sold)throw new Error('net_units vượt sold_units');
    return {session_id:nonblank(raw.session_id,'session_id'),channel_username:onlyChannel(raw.channel_username),
      title:nonblank(raw.title||'Phiên LIVE','title',300),host_name:optional(raw.host_name,80),
      started_at:iso(raw.started_at,'started_at'),ended_at:raw.ended_at?iso(raw.ended_at,'ended_at'):null,
      gross_gmv_vnd:gross,canceled_refunded_vnd:refunded,net_gmv_vnd:net,sold_units:sold,net_units:netUnits,
      source_updated_at:iso(raw.source_updated_at,'source_updated_at'),reconciled_at:raw.reconciled_at?iso(raw.reconciled_at,'reconciled_at'):null};
  }
  if(source==='affiliate'){
    const gross=money(raw.gross_gmv_vnd,'gross_gmv_vnd');const net=money(raw.net_gmv_vnd,'net_gmv_vnd');
    if(net>gross)throw new Error('GMV sau hoàn/hủy vượt GMV');
    return {session_id:nonblank(raw.session_id,'session_id'),creator_id:optional(raw.creator_id,128),
      creator_handle:optional(raw.creator_handle,128),creator_name:optional(raw.creator_name,255),
      started_at:iso(raw.started_at,'started_at'),gross_gmv_vnd:gross,net_gmv_vnd:net,
      order_count:money(raw.order_count,'order_count')};
  }
  if(source==='ads')return {advertiser_id:nonblank(raw.advertiser_id,'advertiser_id'),
    campaign_id:nonblank(raw.campaign_id,'campaign_id'),campaign_name:nonblank(raw.campaign_name,'campaign_name',255),
    report_date:nonblank(raw.report_date,'report_date',10),spend_vnd:money(raw.spend_vnd,'spend_vnd'),
    attributed_revenue_vnd:money(raw.attributed_revenue_vnd,'attributed_revenue_vnd'),
    impressions:money(raw.impressions,'impressions'),clicks:money(raw.clicks,'clicks'),orders:money(raw.orders,'orders')};
  if(source==='orders'){
    const gross=money(raw.gross_amount_vnd,'gross_amount_vnd');
    const refund=money(raw.refunded_amount_vnd,'refunded_amount_vnd');
    if(refund>gross)throw new Error('Refund vượt giá trị đơn');
    return {order_id:nonblank(raw.order_id,'order_id'),live_session_id:optional(raw.live_session_id,128),
      channel_username:onlyChannel(raw.channel_username),order_status:nonblank(raw.order_status,'order_status',80),
      gross_amount_vnd:gross,refunded_amount_vnd:refund,
      final_amount_vnd:raw.final_amount_vnd==null?gross-refund:money(raw.final_amount_vnd,'final_amount_vnd'),
      last_source_update:iso(raw.last_source_update,'last_source_update')};
  }
  throw new Error('Nguồn không được hỗ trợ');
}
export function statement(db,source,row){
  if(source==='seller')return db.prepare(`INSERT INTO live_sessions
    (session_id,channel_username,title,host_name,started_at,ended_at,gross_gmv_vnd,canceled_refunded_vnd,net_gmv_vnd,sold_units,net_units,source_updated_at,reconciled_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(session_id) DO UPDATE SET
    channel_username=excluded.channel_username,title=excluded.title,
    host_name=COALESCE(NULLIF(excluded.host_name,''),live_sessions.host_name),
    started_at=excluded.started_at,ended_at=excluded.ended_at,
    gross_gmv_vnd=excluded.gross_gmv_vnd,canceled_refunded_vnd=excluded.canceled_refunded_vnd,
    net_gmv_vnd=excluded.net_gmv_vnd,sold_units=excluded.sold_units,net_units=excluded.net_units,
    source_updated_at=excluded.source_updated_at,reconciled_at=excluded.reconciled_at
    WHERE live_sessions.source_updated_at IS NULL OR excluded.source_updated_at IS NULL OR excluded.source_updated_at>=live_sessions.source_updated_at`)
    .bind(row.session_id,row.channel_username,row.title,row.host_name,row.started_at,row.ended_at,
      row.gross_gmv_vnd,row.canceled_refunded_vnd,row.net_gmv_vnd,row.sold_units,row.net_units,row.source_updated_at,row.reconciled_at);
  if(source==='affiliate')return db.prepare(`INSERT INTO affiliate_sessions (session_id,creator_id,creator_handle,creator_name,started_at,gross_gmv_vnd,net_gmv_vnd,order_count)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET creator_id=excluded.creator_id,
    creator_handle=excluded.creator_handle,creator_name=excluded.creator_name,started_at=excluded.started_at,
    gross_gmv_vnd=excluded.gross_gmv_vnd,net_gmv_vnd=excluded.net_gmv_vnd,order_count=excluded.order_count,
    updated_at=CURRENT_TIMESTAMP`).bind(row.session_id,row.creator_id,row.creator_handle,row.creator_name,
      row.started_at,row.gross_gmv_vnd,row.net_gmv_vnd,row.order_count);
  if(source==='ads')return db.prepare(`INSERT INTO ads_campaigns (advertiser_id,campaign_id,campaign_name,report_date,spend_vnd,attributed_revenue_vnd,impressions,clicks,orders)
    VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(advertiser_id,campaign_id,report_date) DO UPDATE SET
    campaign_name=excluded.campaign_name,spend_vnd=excluded.spend_vnd,
    attributed_revenue_vnd=excluded.attributed_revenue_vnd,impressions=excluded.impressions,
    clicks=excluded.clicks,orders=excluded.orders,updated_at=CURRENT_TIMESTAMP`)
    .bind(row.advertiser_id,row.campaign_id,row.campaign_name,row.report_date,row.spend_vnd,
      row.attributed_revenue_vnd,row.impressions,row.clicks,row.orders);
  return db.prepare(`INSERT INTO order_reconciliations
    (order_id,live_session_id,channel_username,order_status,gross_amount_vnd,refunded_amount_vnd,final_amount_vnd,last_source_update)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET
    live_session_id=excluded.live_session_id,channel_username=excluded.channel_username,
    order_status=excluded.order_status,gross_amount_vnd=excluded.gross_amount_vnd,
    refunded_amount_vnd=excluded.refunded_amount_vnd,final_amount_vnd=excluded.final_amount_vnd,
    last_source_update=excluded.last_source_update,reconciled_at=CURRENT_TIMESTAMP
    WHERE order_reconciliations.last_source_update IS NULL OR excluded.last_source_update IS NULL OR excluded.last_source_update >= order_reconciliations.last_source_update`)
    .bind(row.order_id,row.live_session_id,row.channel_username,row.order_status,row.gross_amount_vnd,
      row.refunded_amount_vnd,row.final_amount_vnd,row.last_source_update);
}
export async function importBatch(env,source,items,batchKey){
  if(!SOURCES.includes(source))throw new Error('Nguồn nhập không hợp lệ');
  if(!Array.isArray(items)||items.length<1||items.length>100)throw new Error('Mỗi lần nhập 1–100 bản ghi');
  if(!batchKey||typeof batchKey!=='string'||batchKey.length>128)throw new Error('Thiếu batch_key (idempotency key)');
  const unique = new Set();
  const clean = items.map(row=>{
    const parsed=normalize(source,row);
    const key=source==='seller'?parsed.session_id:source==='affiliate'?parsed.session_id:source==='orders'?parsed.order_id:`${parsed.advertiser_id}/${parsed.campaign_id}/${parsed.report_date}`;
    if(unique.has(key)) throw new Error(`Trùng ID trong cùng batch: ${key}`);
    unique.add(key);return parsed;
  });
  // DB.batch chạy trong một transaction: thất bại sẽ rollback batch.
  // Batch key là khóa chống nhập lại cùng một lô dữ liệu khi mạng timeout.
  const insertKey=env.DB.prepare('INSERT INTO ingest_batch_keys (batch_key,source) VALUES (?,?)').bind(batchKey,source);
  const exists=await env.DB.prepare('SELECT batch_key, source FROM ingest_batch_keys WHERE batch_key=?').bind(batchKey).first();
  if(exists){
    if(exists.source!==source)throw new Error('Batch key đã được dùng cho nguồn khác');
    return {already_processed:true,source,processed:0};
  }
  const runId=crypto.randomUUID();
  const statements=[insertKey,...clean.map(row=>statement(env.DB,source,row)),
    env.DB.prepare(`INSERT INTO sync_runs(run_id,source,status,item_count,message) VALUES (?,?,?,?,?)`)
      .bind(runId,source,'success',clean.length,'Imported from trusted connector / Cloud Shell'),
    env.DB.prepare(`INSERT INTO sync_watermarks(source,last_success_at,total_items_processed,updated_at)
      VALUES(?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP)
      ON CONFLICT(source) DO UPDATE SET last_success_at=CURRENT_TIMESTAMP,
      total_items_processed=sync_watermarks.total_items_processed+excluded.total_items_processed,
      updated_at=CURRENT_TIMESTAMP,last_error=NULL`).bind(source,clean.length)];
  await env.DB.batch(statements);
  return {already_processed:false,source,processed:clean.length,run_id:runId};
}
export async function syncStatus(env){
  const result=await env.DB.prepare('SELECT source,last_success_at,last_error,total_items_processed FROM sync_watermarks').all();
  const map=new Map((result.results||[]).map(row=>[row.source,row]));
  const ready=Boolean(env.SYNC_INGEST_KEY);
  const sources=SOURCES.map(source=>({source,configured:ready,last_success_at:map.get(source)?.last_success_at||null,
    last_error:map.get(source)?.last_error||null,processed:map.get(source)?.total_items_processed||0}));
  const ch=(await env.DB.prepare('SELECT username,display_name,tiktok_creator_id FROM official_channels ORDER BY username').all()).results||[];
  return {mode:'live',ingest_configured:ready,tiktok_auto_fetch_configured:false,
    note:'Dữ liệu thật từ D1. API TikTok trực tiếp cần OAuth/scope và adapter riêng.',sources,channels:ch};
}
export async function validateIngestKey(request,env){
  const match=(request.headers.get('Authorization')||'').match(/^Bearer ([\x21-\x7e]{30,})$/);
  if(!match||!env.SYNC_INGEST_KEY)return false;
  const encoder=new TextEncoder();
  const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(match[1])),crypto.subtle.digest('SHA-256',encoder.encode(env.SYNC_INGEST_KEY))]);
  const av=new Uint8Array(a),bv=new Uint8Array(b);let v=0;
  for(let i=0;i<av.length;i++)v|=av[i]^bv[i];
  return v===0;
}
