/* DATA SHOPKHANGBABY | Trích từ demo V40 | JS truyền thống, tải theo đúng thứ tự. */
    function renderConnect(){
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live')return `
        <section class="panel" style="margin-bottom:16px">
          <div class="panel-head"><div><h3>${icon('cloud','heading-icon')} Kết nối nguồn dữ liệu thật</h3><div class="mini">Firebase Authentication • Cloudflare Worker • Cloudflare D1</div></div><span class="pill ok">Live backend</span></div>
          <div id="liveSyncStatus" class="v50-status" aria-live="polite">Đang đọc trạng thái từ Cloudflare Worker...</div>
          <div class="manual-sync-row"><div class="manual-sync-info"><b>Làm mới dữ liệu trên màn hình</b><span class="mini">Không gọi lại TikTok; lấy bản ghi mới nhất đã được lưu trong D1.</span></div><div class="manual-sync-actions"><button class="btn primary" type="button" onclick="window.ShopKhangBabyLive.refreshData().then(()=>toast('Đã tải lại dữ liệu từ D1')).catch(e=>toast(e.message,'error'))">${icon('refresh')} Tải lại dữ liệu</button><button class="btn ghost" type="button" onclick="window.ShopKhangBabyLive.refreshStatus()">Kiểm tra nguồn</button></div></div>
          <div class="note" style="margin-top:14px"><b>Cấu hình một lần tại Cloud Shell/Cloudflare:</b> Worker URL, Firebase và các secret không cần nhập lại trên giao diện. Bản ghi LIVE và đơn hàng có khóa chống trùng và ghi đè snapshot mới nhất. <b>Chưa tự lấy TikTok API</b> cho đến khi bạn cấp OAuth/scope và triển khai adapter phù hợp.</div>
        </section>
        <section class="panel"><div class="panel-head"><div><h3>Hướng dẫn quản trị kết nối</h3><div class="mini">Không hiển thị và không lưu token thật trên trình duyệt</div></div></div>
          <div class="note"><b>TikTok Seller:</b> cần cấp quyền LIVE Analytics / Orders / Refunds.<br><br><b>Partner Center:</b> quản lý token tại Cloudflare Worker, có tác vụ làm mới token riêng.<br><br><b>Cloud Shell:</b> chạy script <code>cloudflare/scripts/ingest.mjs</code> để nhập batch đã chuẩn hóa, không nhập lại ở web.<br><br><b>Chống trùng:</b> LIVE dùng Session ID, Orders dùng Order ID.</div>
        </section>`;
      return `
        <section class="panel" style="margin-bottom:16px">
          <div class="panel-head"><div><h3>${icon('video','heading-icon')} Phạm vi thu thập LIVE của shop</h3><div class="mini">Danh sách kênh được duyệt – giới hạn cố định trong bản demo</div></div><span class="pill ok">Chỉ 2 kênh</span></div>
          <div class="allowlist-grid">
            ${OFFICIAL_CHANNELS.map(ch=>`<div class="allowlist-card"><span class="allowlist-mark">${icon('check')}</span><div><b>${ch}</b><div class="mini">Phiên LIVE chính thức được đưa vào Tổng quan, Đối soát LIVE, KPI Host</div></div><span class="pill ok">Được phép</span></div>`).join('')}
          </div>
          <div class="note" style="margin-top:14px">Khi kết nối thật, đối chiếu <b>creator account ID do TikTok trả về</b> với hai tài khoản đã xác thực; không chỉ lọc theo chuỗi username ở giao diện. Không đưa LIVE của các tài khoản ngoài danh sách hai kênh vào báo cáo nội bộ.</div>
        </section>
        <section class="panel" style="margin-bottom:16px">
          <div class="panel-head"><div><h3>${icon('refresh','heading-icon')} Đồng bộ dữ liệu tự động</h3><div class="mini">Cấu hình cách dashboard sẽ đồng bộ 24/24 khi đã triển khai Workers Cron, webhook và API thực</div></div><span class="pill warn">Chưa kết nối backend</span></div>
          <div class="status-strip"><span class="auto-indicator ${state.autoEnabled?'':'off'}"><span class="status-dot"></span>${state.autoEnabled?'Tự động: BẬT (mô phỏng)':'Tự động: TẮT'}</span><span class="mini" id="autoLastSync">Lần cập nhật demo: ${state.lastDemoSync || 'Chưa có'}</span></div>
          <div class="config-form">
            <label class="field">Trạng thái tự động<select id="autoEnabled" onchange="changeSyncSettings()"><option value="yes" ${state.autoEnabled?'selected':''}>Bật auto sync</option><option value="no" ${!state.autoEnabled?'selected':''}>Tắt auto sync</option></select><small>Trong demo chỉ cập nhật thời gian hiển thị; không gọi API</small></label>
            <label class="field">Chu kỳ đồng bộ<select id="autoMinutes" onchange="changeSyncSettings()">${[1,5,15,30,60].map(v=>`<option value="${v}" ${state.autoMinutes===v?'selected':''}>${v} phút</option>`).join('')}</select><small>Cloudflare Cron sẽ chạy độc lập trình duyệt khi triển khai thật</small></label>
          </div>
          <div class="note" style="margin-top:14px">Để chạy 24/24 thực sự, cần triển khai Cloudflare Workers Cron/Queues hoặc webhook TikTok, tự làm mới token, đồng bộ tăng dần và đối soát lại các đơn thay đổi trạng thái. File HTML đang mở trên máy không thể tự đồng bộ dữ liệu thật khi bạn đóng trình duyệt.</div>
        </section>
        <section class="panel" style="margin-bottom:16px" aria-label="Đồng bộ dữ liệu thủ công">
          <div class="panel-head"><div><h3>${icon('refresh','heading-icon')} Đồng bộ thủ công</h3><div class="mini">Chỉ thực hiện khi bạn chủ động bấm nút; không thay đổi lịch đồng bộ tự động ở trên.</div></div><span class="pill purple">Thao tác theo yêu cầu</span></div>
          <div class="manual-sync-row">
            <div class="manual-sync-info"><b>Chạy đồng bộ theo yêu cầu</b><span class="mini">Lần chạy thủ công: ${state.lastManualSync || 'Chưa thực hiện'}</span></div>
            <div class="config-actions manual-sync-actions"><button type="button" class="btn primary" onclick="refreshDemo()">${icon('refresh')} Đồng bộ ngay</button><button type="button" class="btn ghost" onclick="go('orders')">${icon('receipt')} Xem đối soát</button></div>
          </div>
          <div class="mini" style="margin-top:12px">Bản demo chỉ mô phỏng cập nhật. Khi tích hợp API thật, thao tác này sẽ gọi tiến trình đồng bộ thủ công trên máy chủ.</div>
          <details class="manual-sync-log"><summary>Lịch sử đồng bộ (${state.syncHistory.length})</summary><ul class="log-list" id="syncLog">${state.syncHistory.length?state.syncHistory.map(x=>`<li>${configSafe(x)}</li>`).join(''):'<li>Chưa có lịch sử mô phỏng trong lượt mở này.</li>'}</ul></details>
        </section>
        <section class="panel api-console" aria-label="Thiết lập API TikTok">
          <div class="panel-head"><div><h3>${icon('plug','heading-icon')} Cấu hình API cho từng nguồn dữ liệu</h3><div class="mini">Chỉ duy trì kết nối cho hai kênh LIVE chính thức, đối soát và hạ tầng.</div></div><span class="pill purple">Chỉ quản trị viên</span></div>
          <div class="api-connector-overview">
            <div class="api-overview-item"><span class="api-source-icon">${icon('shopping-bag')}</span><div><b>Seller</b><small>LIVE · Đơn hàng · Hoàn trả</small></div><span class="api-pending">Chưa kết nối</span></div>
            <div class="api-overview-item"><span class="api-source-icon">${icon('users')}</span><div><b>Partner Center</b><small>Đối tác · API scopes · Assets</small></div><span class="api-pending">Chưa kết nối</span></div>
          </div>
          <div class="config-tabs api-config-tabs" role="tablist" aria-label="Chọn nguồn kết nối">
            <button type="button" class="${state.integrationTab==='shop'?'selected':''}" onclick="state.integrationTab='shop';render()">${icon('shopping-bag')} Seller</button>
            <button type="button" class="${state.integrationTab==='partner'?'selected':''}" onclick="state.integrationTab='partner';render()">${icon('users')} Partner Center</button>
            <button type="button" class="${state.integrationTab==='infra'?'selected':''}" onclick="state.integrationTab='infra';render()">${icon('cloud')} Firebase / Cloudflare</button>
          </div>
          <div class="api-security-banner">${icon('shield')} <div><b>Chưa cấp quyền TikTok — đang dùng dữ liệu mô phỏng</b><span>Chỉ điền mã định danh, URL hoặc scopes không bí mật để xem thử. Không nhập App Secret, Access Token hoặc Refresh Token trong file HTML. OAuth thật cần Cloudflare Worker bảo mật.</span></div></div>
          <form id="integrationForm" onsubmit="saveIntegration(event)" class="config-form api-form">${integrationFields()}
            <div class="field full"><div class="config-actions api-main-actions">
              <button class="btn primary" type="submit">${icon('save')} Lưu cấu hình demo</button>
              <button class="btn ghost" type="button" onclick="checkConnectionConfigDemo()">${icon('check-square')} Kiểm tra mục còn thiếu</button>
            </div></div>
          </form>
          <div class="api-check-result" id="connectionCheckResult" aria-live="polite"><b>Chưa xác thực.</b> Điền thông tin ứng dụng rồi bấm “Kiểm tra mục còn thiếu”. Không thực hiện kết nối TikTok thực.</div>
          ${state.integrationTab==='partner' ? `
          <section class="partner-refresh-card" aria-label="Tự gia hạn token TikTok Shop Partner">
            <div class="partner-refresh-top"><span class="partner-refresh-icon">${icon('refresh')}</span><div><b>Tự động gia hạn Partner Token</b><span>Cloudflare kiểm tra mỗi 15 phút và gia hạn trước khi hết hạn khoảng 30 phút.</span></div><span class="pill purple">Chờ cấu hình thật</span></div>
            <div id="partnerTokenStatus" class="partner-refresh-status" aria-live="polite">
              <b>Chưa kết nối Cloudflare Worker</b>
              <span>Chỉ gia hạn thật sau khi triển khai Worker, cấp App Key/Secret, refresh token ban đầu và bật Cron. Không nhập token vào website này.</span>
            </div>
            <div class="partner-refresh-actions">
              <button class="btn ghost" type="button" onclick="checkPartnerTokenStatus()">${icon('refresh')} Kiểm tra trạng thái</button>
              <span class="mini">Nếu Refresh Token hết hạn hoặc bị thu hồi, TikTok sẽ yêu cầu ủy quyền lại.</span>
            </div>
          </section>` : ''}
          <details class="api-steps" id="authFlowGuide"><summary>${icon('info')} Hướng dẫn kết nối thật và quyền cần có</summary>${integrationHelpHtml()}</details>
        </section>`;
    }
    function integrationHelpHtml(){
      if(state.integrationTab==='shop') return `<ol><li>Tạo ứng dụng TikTok Shop trong Partner Center, bật các scope Seller cần thiết.</li><li>Thiết lập Redirect URI HTTPS và Seller authorization flow; mã ủy quyền được xử lý ở backend.</li><li>Đổi code sang token qua <code>auth.tiktok-shops.com</code>; lấy Shop Cipher từ API Get Authorized Shops.</li><li>Đọc LIVE Analytics, đơn và hoàn trả; so ID Creator với hai kênh chính thức.</li></ol><a href="https://partner.tiktokshop.com/docv2/page/create-your-app" target="_blank" rel="noopener noreferrer">Tài liệu tạo ứng dụng TikTok Shop ↗</a>`;
      if(state.integrationTab==='partner') return `<ol><li>Hoàn thành hồ sơ Partner Center và xác nhận dịch vụ/loại Partner được duyệt.</li><li>Thiết lập Partner authorization (khác Seller authorization) và lấy token Partner.</li><li>Cấp refresh token ban đầu cho Worker bằng Wrangler Secret; Cron sẽ tự gia hạn và thay thế token đã mã hóa trong D1.</li><li>Gọi Get Authorized Category Assets nếu quyền <code>partner.authorization.info</code> có hiệu lực.</li><li>Lưu category_asset_cipher cùng loại business category, sau đó mới dùng API Partner được cấp.</li></ol><a href="https://partner.tiktokshop.com/docv2/page/get-authorized-category-assets-202405" target="_blank" rel="noopener noreferrer">Get Authorized Category Assets ↗</a>`;
      return `<ol><li>Triển khai Firebase Auth Google, cấu hình domain được cấp phép.</li><li>Triển khai Worker kiểm tra Firebase ID token và quyền quản trị ở D1.</li><li>Đăng ký callback OAuth TikTok theo từng nguồn, bảo vệ state/nonce và lưu token phía backend.</li><li>Cấu hình Cron/Queue, mã hóa token và nhật ký đồng bộ.</li></ol><span>Xem file <code>docs/API_CONNECTIONS.md</code> trong ZIP V43 để triển khai từng bước.</span>`;
    }
    function checkConnectionConfigDemo(){
      const fields={
        shop:[['shop_app_key','App Key'],['shop_cipher','Shop Cipher'],['shop_redirect','OAuth Redirect URI'],['shop_scopes','Scopes đã cấp']],
        partner:[['partner_app_key','Partner App Key'],['partner_redirect','Partner Redirect URI'],['partner_scopes','Partner Scopes'],['partner_category_cipher','Category Asset Cipher (nếu endpoint yêu cầu)']],
        infra:[['firebase_project','Firebase Project ID'],['firebase_auth','Firebase Auth Domain'],['backend_url','Worker API URL']]
      };
      const form=document.getElementById('integrationForm');
      const labels=(fields[state.integrationTab]||[]).filter(([key])=>!String(form?.elements.namedItem(key)?.value||'').trim()).map(([,name])=>name);
      const result=document.getElementById('connectionCheckResult');
      if(result){
        const text=labels.length ? `Cần kiểm tra/bổ sung: ${labels.join(' · ')}.` : 'Các trường cấu hình tham khảo đã được điền.';
        result.innerHTML=`<b>${labels.length?'Thiếu cấu hình tham khảo':'Đã điền cấu hình tham khảo'}</b><span>${configSafe(text)} ${labels.length?'':'Đây KHÔNG phải kết quả kiểm tra token hoặc quyền thật.'}</span><span class="api-check-foot">Chưa gọi API TikTok và chưa xác minh OAuth. Backend vẫn cần được triển khai.</span>`;
      }
      toast(labels.length?'Đã liệt kê các mục cấu hình tham khảo còn thiếu.':'Đã điền các mục tham khảo; chưa xác thực TikTok.', 'info','Kiểm tra cấu hình demo');
    }
    function saveIntegration(e){
      e.preventDefault();
      if(!hasPermission('manageAPI')) return toast('Không có quyền thay đổi kết nối');
      new FormData(e.target).forEach((v,k)=>{if(!/token|secret/i.test(k))localStorage.setItem('dskh_cfg_'+k,String(v));});
      toast('Đã lưu các ID và cấu hình không bí mật trên trình duyệt demo');
    }
    function changeSyncSettings(){
      state.autoEnabled=document.getElementById('autoEnabled').value==='yes';
      state.autoMinutes=Number(document.getElementById('autoMinutes').value);
      localStorage.setItem('dskh_auto_enabled',String(state.autoEnabled));
      localStorage.setItem('dskh_auto_minutes',String(state.autoMinutes));
      installDemoAutoSync();render();
    }
    let demoAutoTimer=null;
    function installDemoAutoSync(){
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live')return;
      if(demoAutoTimer)clearInterval(demoAutoTimer);
      if(state.autoEnabled){demoAutoTimer=setInterval(()=>{
        state.lastDemoSync=new Date().toLocaleString('vi-VN');
        state.syncHistory.unshift('Mô phỏng tự cập nhật lúc '+state.lastDemoSync+' (không gọi TikTok API)');
        state.syncHistory=state.syncHistory.slice(0,10);
        updateSyncLabel();
        if(state.currentTab==='connect')render();
      },Math.max(1,state.autoMinutes)*60000);}
      updateSyncLabel();
    }
    function updateSyncLabel(){
      const el=document.getElementById('syncText');
      if(el)el.textContent=state.autoEnabled?'Auto demo • mỗi '+state.autoMinutes+' phút':'Auto demo • đang tắt';
    }


    // Dropdown tùy chỉnh: không sử dụng menu xanh mặc định của hệ điều hành.
    // Select gốc vẫn giữ giá trị và các hàm onchange đang hoạt động.

// V44: Trạng thái backend THẬT; tuyệt đối không dùng các trường token trong HTML.
// Firebase Authentication thực chưa được nối trong demo. Khi triển khai, ứng dụng đăng nhập
// phải cung cấp window.shopKhangBabyGetIdToken() trả về Firebase ID token của người dùng.
async function checkPartnerTokenStatus(){
  const node=document.getElementById('partnerTokenStatus');
  if(!node) return;
  const base=window.SHOPKHANGBABY_CONFIG?.apiBaseUrl;
  if(!base){
    node.innerHTML='<b>Chưa kết nối backend</b><span>Chạy Cloudflare Worker và cấu hình apiBaseUrl để theo dõi việc gia hạn token thực tế.</span>';
    return;
  }
  if(typeof window.shopKhangBabyGetIdToken!=='function'){
    node.innerHTML='<b>Chưa có đăng nhập Firebase thật</b><span>Cần tích hợp Firebase Auth trước khi quản trị viên có thể đọc trạng thái gia hạn token.</span>';
    return;
  }
  node.textContent='Đang kiểm tra trạng thái từ Cloudflare...';
  try{
    const idToken=await window.shopKhangBabyGetIdToken();
    const data=await window.ShopKhangBabyApi.getPartnerTokenStatus(idToken);
    const statusMap={active:'Đang hoạt động',awaiting_initial_authorization:'Chưa cấp refresh token ban đầu',not_configured:'Chưa cấu hình Worker',retry_scheduled:'Đang chờ thử lại',reauthorization_required:'Cần ủy quyền lại'};
    const line=document.createElement('b');line.textContent=statusMap[data.status]||'Chưa xác định';
    const detail=document.createElement('span');
    const formatted=seconds=>seconds?new Date(seconds*1000).toLocaleString('vi-VN'):'Chưa có';
    detail.textContent=`Hết hạn access token: ${formatted(data.access_expires_at)}. Lần gia hạn thành công: ${formatted(data.last_success_at)}. Gia hạn dự kiến: ${formatted(data.next_refresh_at)}.`;
    node.replaceChildren(line,detail);
  }catch(err){
    const line=document.createElement('b');line.textContent='Không đọc được trạng thái token';
    const detail=document.createElement('span');detail.textContent='Kiểm tra quyền Admin, cấu hình Firebase và đường dẫn Worker. Không có token nào được hiển thị trong trình duyệt.';
    node.replaceChildren(line,detail);
  }
}
