// Dữ liệu THẬT: chỉ đọc từ Worker đã xác minh Firebase UID và quyền server.
// Không trộn bất kỳ dữ liệu demo nào vào mode live.
const V50_LIVE=window.SHOPKHANGBABY_CONFIG?.mode==='live';
let v50LastStatus=null;
let v50RefreshTimer=null;
const v50TextDate=iso=>{
  if(!iso)return null;
  const dt=new Date(iso);
  if(!Number.isFinite(dt.getTime()))return null;
  return new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric',hourCycle:'h23'}).format(dt).replace(',','');
};
const v50Date=iso=>v50TextDate(iso)||'00:00 01/01/1970';
const v50RealLive=r=>{
  const minutes=Math.max(0,Math.round((new Date(r.ended_at||r.started_at)-new Date(r.started_at))/60000));
  return {id:String(r.session_id),title:r.title||'Phiên LIVE',channel:r.channel_username==='shopkhangbaby'?'ShopKhangBaby':'Mẹ Khang Sữa',
    host:r.host_name||'Chưa gắn',start:v50Date(r.started_at),duration:`${Math.floor(minutes/60)}h${minutes%60}min`,hours:minutes/60,
    gross:Number(r.gross_gmv_vnd||0),refund:Number(r.canceled_refunded_vnd||0),orders:Number(r.sold_units||0),
    canceled:Math.max(0,Number(r.sold_units||0)-Number(r.net_units||0)),
    status:r.reconciled_at?'Đã chốt đối soát':'Đang theo dõi'};
};
const v50RealAffiliate=r=>{
  const gross=Number(r.gross_gmv_vnd||0),net=Number(r.net_gmv_vnd||0);
  return {id:String(r.session_id),creator:r.creator_name||'Nhà sáng tạo',handle:r.creator_handle||'',
    title:'LIVE Affiliate',start:v50Date(r.started_at),duration:'Chưa có dữ liệu',gross,refund:Math.max(0,gross-net),
    orders:Number(r.order_count||0),returned:0,products:0,status:'Chờ đối soát'};
};
async function v50FetchAll(method,token,maxPages=20){
  const items=[];
  for(let page=1;page<=maxPages;page++){
    const payload=await window.ShopKhangBabyApi[method](token,page,100);
    const batch=Array.isArray(payload.items)?payload.items:[];
    items.push(...batch);
    if(batch.length<100)break;
  }
  return items;
}
async function v50RefreshData(){
  if(!V50_LIVE || !state.signedIn)return;
  const token=await window.shopKhangBabyGetIdToken();
  const [live,affiliate,ads]=await Promise.all([
    v50FetchAll('getLiveSessions',token),
    ['Admin','Ops'].includes(state.role)?v50FetchAll('getAffiliateSessions',token):Promise.resolve([]),
    ['Admin','Ops'].includes(state.role)?v50FetchAll('getAdsCampaigns',token):Promise.resolve([])
  ]);
  state.liveData=live.map(v50RealLive);
  demoAffiliateLives.splice(0,demoAffiliateLives.length,...affiliate.map(v50RealAffiliate));
  window.V50_REAL_ADS=ads;
  render();
}
async function v50RefreshStatus(){
  const node=document.getElementById('liveSyncStatus');
  if(!V50_LIVE || !node)return;
  try{
    const token=await window.shopKhangBabyGetIdToken();
    const data=await window.ShopKhangBabyApi.syncStatus(token);
    v50LastStatus=data;
    const label={seller:'LIVE Seller',affiliate:'LIVE Affiliate',ads:'TikTok Ads',orders:'Đơn hàng / hoàn hủy'};
    node.innerHTML=`<div class="v50-status-head"><b>Trạng thái dữ liệu từ Cloudflare D1</b><span class="pill purple">Nguồn thật</span></div>
      <p class="mini">Không cần nhập lại ID/token trên website. Dữ liệu vào Worker qua tác vụ đồng bộ bảo mật; mỗi ID chỉ có một bản ghi.</p>
      <div class="v50-sync-grid">${data.sources.map(s=>`<div class="v50-sync-card"><b>${label[s.source]}</b><small>${s.last_success_at?'Lần nhập thành công: '+s.last_success_at:'Chưa có dữ liệu nhập thành công'}</small><span>${Number(s.processed||0).toLocaleString('vi-VN')} lượt xử lý • ${s.last_error?'Cần kiểm tra lỗi':'Chưa báo lỗi'}</span></div>`).join('')}</div>
      <div class="v50-channel-list">${data.channels.map(c=>`<span>${c.display_name} (${c.username}) • ${c.tiktok_creator_id?'Đã lưu Creator ID':'Chưa xác minh Creator ID'}</span>`).join('')}</div>
      <p class="mini">${data.ingest_configured?'Đã cấu hình khóa nhập dữ liệu backend.':'Chưa cấu hình khóa nhập dữ liệu.'} ${data.tiktok_auto_fetch_configured?'Có adapter tự lấy dữ liệu.':'Chưa có adapter tự gọi TikTok API: cần OAuth và quyền API thực tế.'}</p>`;
  }catch(e){node.textContent='Không đọc được trạng thái đồng bộ: '+e.message;}
}
function v50RealAdsHtml(){
  const rows=window.V50_REAL_ADS||[];
  return `<section class="panel"><div class="panel-head"><div><h3>Chiến dịch quảng cáo — dữ liệu thật</h3><div class="mini">Các bản ghi đã nhập vào Cloudflare D1, không dùng số liệu quảng cáo mẫu.</div></div></div><div class="table-wrap"><table><thead><tr><th>Ngày</th><th>Chiến dịch</th><th>Advertiser ID</th><th>Chi tiêu</th><th>Doanh thu quy gán</th><th>Hiển thị</th><th>Nhấp</th><th>Đơn</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.report_date}</td><td>${configSafe(x.campaign_name)}</td><td>${configSafe(x.advertiser_id)}</td><td>${money(Number(x.spend_vnd))}</td><td>${money(Number(x.attributed_revenue_vnd))}</td><td>${Number(x.impressions).toLocaleString('vi-VN')}</td><td>${Number(x.clicks).toLocaleString('vi-VN')}</td><td>${Number(x.orders).toLocaleString('vi-VN')}</td></tr>`).join('')||'<tr><td colspan="8">Chưa có dữ liệu Ads thật. Hãy hoàn tất ủy quyền TikTok Ads và bộ đồng bộ API.</td></tr>'}</tbody></table></div></section>`;
}
window.ShopKhangBabyLive={
  async signedIn(user,me){
    state.role=me.role;
    state.profile={displayName:user.displayName||user.email,email:user.email||'',photoURL:user.photoURL||'',uid:user.uid,emailVerified:user.emailVerified,provider:'firebase'};
    state.signedIn=true;
    syncAuthView();
    state.liveData=[];demoAffiliateLives.splice(0,demoAffiliateLives.length);window.V50_REAL_ADS=[];
    render();
    try{await v50RefreshData();}catch(err){toast('Không đọc được dữ liệu thật: '+err.message,'error');}
    if(v50RefreshTimer)clearInterval(v50RefreshTimer);
    v50RefreshTimer=setInterval(()=>{if(state.signedIn && document.visibilityState==='visible')v50RefreshData().catch(()=>{});},15*60*1000);
  },
  signedOut(){
    if(v50RefreshTimer){clearInterval(v50RefreshTimer);v50RefreshTimer=null;}
    state.signedIn=false;state.liveData=[];demoAffiliateLives.splice(0,demoAffiliateLives.length);window.V50_REAL_ADS=[];
    syncAuthView();
  },
  authError(message){
    const note=document.querySelector('.login-note');
    if(note){note.textContent=message;note.style.color='#b04c72';}
  },
  refreshData:v50RefreshData,
  refreshStatus:v50RefreshStatus
};
if(V50_LIVE){
  state.signedIn=false;
  state.liveData=[];
  demoAffiliateLives.splice(0,demoAffiliateLives.length);
  syncAuthView();
  document.querySelector('#loginScreen .login-btn span').textContent='Tiếp tục bằng Google';
  document.querySelector('.login-note').textContent='Đăng nhập Google được xác thực bằng Firebase. Chỉ tài khoản đã được cấp quyền mới truy cập dữ liệu.';
}
