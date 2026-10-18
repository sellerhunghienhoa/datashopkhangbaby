/* DATA SHOPKHANGBABY | Trích từ demo V40 | JS truyền thống, tải theo đúng thứ tự. */
    function parseDMYHM(s){
      const m = s.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if(!m) return null;
      const [,hh,mm,dd,mo,yy] = m;
      return new Date(Number(yy), Number(mo)-1, Number(dd), Number(hh), Number(mm));
    }

    function formatDMYHM(date){
      const pad = n => String(n).padStart(2,'0');
      return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()}`;
    }

    function endTimeOf(item){
      const d = parseDMYHM(item.start);
      if(!d) return '';
      const end = new Date(d.getTime() + Math.round(item.hours * 60) * 60000);
      return formatDMYHM(end);
    }

    function liveTimeRange(item){
      const start = parseDMYHM(item.start);
      if(!start) return item.start;
      const end = parseDMYHM(endTimeOf(item));
      const pad = n => String(n).padStart(2,'0');
      const beginTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      const endTime = end ? `${pad(end.getHours())}:${pad(end.getMinutes())}` : '';
      const startDate = `${pad(start.getDate())}/${pad(start.getMonth()+1)}/${start.getFullYear()}`;
      const endDate = end ? `${pad(end.getDate())}/${pad(end.getMonth()+1)}/${end.getFullYear()}` : startDate;
      return startDate === endDate ? `${beginTime}–${endTime} ${startDate}` : `${beginTime} ${startDate} – ${endTime} ${endDate}`;
    }

    function ordersAfterCancel(item){
      return Math.max(0, item.orders - item.canceled);
    }

    // Giữ dữ liệu gốc để tính giờ, chỉ đổi cách hiển thị sang tiếng Việt đầy đủ.
    function fullDuration(duration){
      const m = String(duration).match(/^(\d+)h(\d+)min$/);
      if(!m) return duration;
      return `${Number(m[1])} giờ ${Number(m[2])} phút`;
    }

    function toInputDate(date){
      const pad = n => String(n).padStart(2,'0');
      return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
    }

    function parseInputDate(value){
      if(!value) return null;
      const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!m) return null;
      return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    }

    function getDefaultMaxDate(){
      const now=new Date();
      return new Date(now.getFullYear(),now.getMonth(),now.getDate());
    }

    function addMonthsSafe(date, months){
      return new Date(date.getFullYear(), date.getMonth()+months, date.getDate());
    }

    function isWithinThreeMonths(start, end){
      if(!start || !end) return true;
      const maxEnd = addMonthsSafe(start, 3);
      return end <= maxEnd;
    }

    function applyPresetDateRange(value){
      const end = getDefaultMaxDate();
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      if(value === '7') start.setDate(end.getDate()-6);
      if(value === '30') start.setDate(end.getDate()-29);
      if(value === '60') start.setDate(end.getDate()-59);
      if(value === '90') start.setDate(end.getDate()-89);
      state.dateStart = toInputDate(start);
      state.dateEnd = toInputDate(end);
    }

    function setQuickDateFilter(value){
      state.dateFilter = ['all','1','7','30','60','90','custom'].includes(value) ? value : '30';
      value=state.dateFilter;
      if(value === 'all'){
        state.dateStart='';
        state.dateEnd='';
      } else if(value !== 'custom') {
        applyPresetDateRange(value);
      } else if(!state.dateStart && !state.dateEnd){
        applyPresetDateRange('30');
      }
      state.livePage=1;
      render();
    }

    function setAffiliateDateFilter(value){
      state.affiliateDate=value;
      if(value!=='custom'){
        state.affiliateStart='';
        state.affiliateEnd='';
      }
      state.affiliatePage=1;
      render();
    }

    function loadState(){
      const hostSaved = localStorage.getItem('dskh_live_host_map');
      let mapped = {};
      if(hostSaved){ try{ mapped = JSON.parse(hostSaved); }catch(e){} }
      state.liveData = baseLives.map(x=>({...x, host:mapped[x.id] || x.host}));
      state.autoEnabled = localStorage.getItem('dskh_auto_enabled') !== 'false';
      state.autoMinutes = Number(localStorage.getItem('dskh_auto_minutes') || 15);
      const role = localStorage.getItem('dskh_role');
      const signed = localStorage.getItem('dskh_signed_in');
      if(role) state.role = role;
      if(signed!==null) state.signedIn = signed === '1';
      const storedMembers=localStorage.getItem('dskh_demo_users_v17');
      let members=defaultTeamMembers();
      if(storedMembers){try{
        const parsed=JSON.parse(storedMembers);
        if(Array.isArray(parsed)){
          const valid=parsed.filter(u=>u && typeof u.id==='string' && typeof u.name==='string' && typeof u.email==='string' && ['Admin','Ops','Host','Viewer'].includes(u.role) && Array.isArray(u.permissions)).slice(0,100);
          members=[members[0],...valid.filter(u=>u.id!=='owner')];
        }
      }catch(e){}}
      state.members=members;
      if(!state.dateStart && !state.dateEnd){ applyPresetDateRange(state.dateFilter || '1'); }
      loadStorageDemoState();
    }

    function saveHosts(){
      const map = {};
      state.liveData.forEach(x=> map[x.id] = x.host);
      localStorage.setItem('dskh_live_host_map', JSON.stringify(map));
    }

    function money(n){ return n.toLocaleString('vi-VN') + 'đ'; }
    function moneyShort(n){
      return money(Math.round(n));
    }
    function formatHoursDecimal(hours){
      const totalMinutes = Math.round(Number(hours || 0) * 60);
      const hh = Math.floor(totalMinutes / 60);
      const mm = totalMinutes % 60;
      return `${hh} giờ ${mm} phút`;
    }
    function formatTimes(value){
      return String(value).replace('.',',') + ' lần';
    }
    function pct(v){ return (v*100).toFixed(1).replace('.0','') + '%'; }
    function toast(msg, kind='success', title='Thông báo'){
      const t = document.getElementById('toast');
      if(!t) return;
      const iconMap={
        success:'<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8.5 12.2 2.3 2.3 4.8-4.8"></path></svg>',
        info:'<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v5"></path><path d="M12 7h.01"></path></svg>',
        error:'<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>'
      };
      t.className='toast '+kind;
      t.innerHTML=`<div class="toast-icon-wrap">${iconMap[kind]||iconMap.success}</div><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-text">${msg}</div></div><button class="toast-close" type="button" aria-label="Đóng thông báo" onclick="hideToast()"><svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>`;
      t.classList.add('show');
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(()=>hideToast(), 5000);
    }
    function hideToast(){
      const t=document.getElementById('toast');
      if(t){t.classList.remove('show');t.style.display='';}
    }

    function totals(rows){
      return rows.reduce((a,x)=>{
        a.gross += x.gross;
        a.refund += x.refund;
        a.orders += x.orders;
        a.hours += x.hours;
        a.canceled += x.canceled;
        return a;
      },{gross:0,refund:0,orders:0,hours:0,canceled:0});
    }

    function filteredLives(){
      return state.liveData.filter(x=>{
        const channel=String(x.channel || '').toLowerCase().trim();
        if(!OFFICIAL_CHANNELS.some(ch=>ch.toLocaleLowerCase('vi-VN')===channel)) return false;
        if(state.channelFilter!=='all' && channel!==String(state.channelFilter).toLocaleLowerCase('vi-VN')) return false;
        // Không áp dụng ô tìm kiếm ẩn tại tab danh sách LIVE.
        const q = state.currentTab==='lives' ? '' : state.search.trim().toLowerCase();
        const hitSearch = !q || x.title.toLowerCase().includes(q) || x.id.includes(q) || x.channel.toLowerCase().includes(q);
        const hitHost = state.hostFilter === 'all' || x.host === state.hostFilter;
        const hitStatus = state.statusFilter === 'all' || x.status === state.statusFilter;
        let hitDate = true;
        const d = parseDMYHM(x.start);
        const startDay = d && new Date(d.getFullYear(),d.getMonth(),d.getDate());
        const from = parseInputDate(state.dateStart);
        const to = parseInputDate(state.dateEnd);
        hitDate = !!startDay && (!from || startDay >= from) && (!to || startDay <= to);
        return hitSearch && hitHost && hitStatus && hitDate;
      });
    }

    function matchSelectedDate(startText){
      const d = parseDMYHM(startText);
      if(!d) return false;
      const startDay = new Date(d.getFullYear(),d.getMonth(),d.getDate());
      const from = parseInputDate(state.dateStart);
      const to = parseInputDate(state.dateEnd);
      return (!from || startDay >= from) && (!to || startDay <= to);
    }

    function buildQuickRangeFilter(){
      return `
        <div class="filter-shell filter-shell-compact">
          <select class="select" aria-label="Lọc thời gian" data-range-select="shared" onchange="setQuickDateFilter(this.value)">
            <option value="all" ${state.dateFilter==='all'?'selected':''}>Tất cả thời gian</option>
            <option value="1" ${state.dateFilter==='1'?'selected':''}>Hôm nay</option>
            <option value="7" ${state.dateFilter==='7'?'selected':''}>7 ngày</option>
            <option value="30" ${state.dateFilter==='30'?'selected':''}>30 ngày</option>
            <option value="60" ${state.dateFilter==='60'?'selected':''}>60 ngày</option>
            <option value="90" ${state.dateFilter==='90'?'selected':''}>90 ngày</option>
            <option value="custom" ${state.dateFilter==='custom'?'selected':''}>Chọn ngày</option>
          </select>
        </div>`;
    }

    function buildToolbar(){
      const statuses = [...new Set(state.liveData.map(x=>x.status))];
      const toolbar = document.getElementById('toolbar');
      if(['lives','orders','kpi','overview'].includes(state.currentTab)){
        toolbar.innerHTML = `
          <div class="filter-grid ${state.currentTab==='lives'?'is-live-page':''}">
            ${state.currentTab==='lives'?'':`<input type="search" placeholder="Tìm tên LIVE / ID phiên / kênh..." value="${state.search.replace(/"/g,'&quot;')}" oninput="state.search=this.value;state.livePage=1;render()">`}
            ${state.currentTab==='lives'?`<select class="select" aria-label="Lọc kênh LIVE chính thức" onchange="state.channelFilter=this.value;state.livePage=1;render()"><option value="all" ${state.channelFilter==='all'?'selected':''}>Cả 2 kênh LIVE</option>${OFFICIAL_CHANNELS.map(ch=>`<option value="${ch}" ${state.channelFilter===ch?'selected':''}>${ch}</option>`).join('')}</select>`:''}
            ${buildQuickRangeFilter()}
            ${state.currentTab==='lives'?'':`<select class="select" aria-label="Lọc kênh LIVE chính thức" onchange="state.channelFilter=this.value;state.livePage=1;render()"><option value="all" ${state.channelFilter==='all'?'selected':''}>Cả 2 kênh LIVE</option>${OFFICIAL_CHANNELS.map(ch=>`<option value="${ch}" ${state.channelFilter===ch?'selected':''}>${ch}</option>`).join('')}</select>`}
            <select class="select" onchange="state.hostFilter=this.value;state.livePage=1;render()">
              <option value="all" ${state.hostFilter==='all'?'selected':''}>Tất cả Host</option>
              ${HOSTS.map(h=>`<option ${state.hostFilter===h?'selected':''}>${h}</option>`).join('')}
            </select>
            <select class="select" onchange="state.statusFilter=this.value;state.livePage=1;render()">
              <option value="all" ${state.statusFilter==='all'?'selected':''}>Tất cả trạng thái</option>
              ${statuses.map(s=>`<option ${state.statusFilter===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="toolbar-group page-actions">
            <button class="btn ghost" onclick="exportCSV()">${icon('download')} Xuất CSV</button>
            ${hasPermission('editHosts') ? `<button class="btn primary" onclick="addDemoLive()">${icon('plus')} Thêm phiên demo</button>` : ''}
          </div>`;
      } else if(state.currentTab==='leaders'){
        toolbar.innerHTML = `
          <div class="filter-grid is-three leaderboard-filters">
            <select class="select" aria-label="Lọc nhóm xếp hạng" onchange="state.leaderScope=this.value;render()">
              <option value="all" ${state.leaderScope==='all'?'selected':''}>Tất cả Nhà sáng tạo & Kênh</option>
              <option value="creator" ${state.leaderScope==='creator'?'selected':''}>Nhà sáng tạo Affiliate</option>
              <option value="channel" ${state.leaderScope==='channel'?'selected':''}>Kênh LIVE chính thức</option>
            </select>
            ${buildQuickRangeFilter()}
            <select class="select" aria-label="Tiêu chí xếp hạng" onchange="state.leaderSort=this.value;render()">
              <option value="net" ${state.leaderSort!=='orders'?'selected':''}>Xếp theo doanh số</option>
              <option value="orders" ${state.leaderSort==='orders'?'selected':''}>Xếp theo số đơn</option>
            </select>
          </div>
          <div class="toolbar-group page-actions"><button class="btn ghost" onclick="exportLeaderboardCSV()">${icon('download')} Xuất bảng xếp hạng</button></div>`;
      } else if(state.currentTab==='affiliate'){
        toolbar.innerHTML = `
          <div class="toolbar-group">
            <input type="search" aria-label="Tìm đối tác hoặc phiên Affiliate" placeholder="Tìm đối tác, tài khoản, phiên LIVE..." value="${configSafe(state.affiliateSearch)}" oninput="state.affiliateSearch=this.value;state.affiliatePage=1;render()">
            <select class="select" aria-label="Lọc thời gian Affiliate" data-range-select="affiliate" onchange="setAffiliateDateFilter(this.value)">
              <option value="all" ${state.affiliateDate==='all'?'selected':''}>Tất cả thời gian</option>
              <option value="1" ${state.affiliateDate==='1'?'selected':''}>Hôm nay</option>
              <option value="7" ${state.affiliateDate==='7'?'selected':''}>7 ngày</option>
              <option value="30" ${state.affiliateDate==='30'?'selected':''}>30 ngày</option>
              <option value="60" ${state.affiliateDate==='60'?'selected':''}>60 ngày</option>
              <option value="90" ${state.affiliateDate==='90'?'selected':''}>90 ngày</option>
              <option value="custom" ${state.affiliateDate==='custom'?'selected':''}>Chọn ngày</option>
            </select>
          </div>
          <div class="toolbar-group"><button class="btn ghost" onclick="exportAffiliateCSV()">${icon('download')} Xuất CSV Affiliate</button></div>`;
      } else if(state.currentTab==='ads'){
        toolbar.innerHTML = `
          <div class="filter-grid is-three">
            <select class="select" onchange="state.channelFilter=this.value;render()">
              <option value="all" ${state.channelFilter==='all'?'selected':''}>Tất cả shop / nguồn quảng cáo</option>
              <option value="shop-001" ${state.channelFilter==='shop-001'?'selected':''}>Shop KhangBaby</option>
              <option value="shop-002" ${state.channelFilter==='shop-002'?'selected':''}>Mẹ Khang Sữa</option>
            </select>
            ${buildQuickRangeFilter()}
            <select class="select" onchange="state.statusFilter=this.value;render()">
              <option value="all" ${state.statusFilter==='all'?'selected':''}>Tất cả trạng thái chiến dịch</option>
              <option value="Đang chạy">Đang chạy</option>
              <option value="Cần tối ưu">Cần tối ưu</option>
              <option value="Tạm dừng">Tạm dừng</option>
            </select>
          </div>
          <div class="toolbar-group page-actions"><button class="btn ghost" onclick="exportAdsCSV()">${icon('download')} Xuất báo cáo Ads</button></div>`;
      } else {
        toolbar.innerHTML = '';
      }
    }

    function renderOverview(){
      const rows = filteredLives();
      const t = totals(rows);
      const net = t.gross - t.refund;
      const cancelRate = t.orders ? t.canceled / t.orders : 0;
      const topHosts = HOSTS.map(host=>{
        const list = rows.filter(x=>x.host===host);
        const sum = totals(list);
        return {host, net:sum.gross-sum.refund, count:list.length};
      }).sort((a,b)=>b.net-a.net);

      return `
        <section class="metrics">
          <div class="metric">
            <div class="metric-top"><span>GMV đã ghi nhận</span><span class="metric-icon tone-violet">${icon('banknote')}</span></div>
            <div class="metric-value">${moneyShort(t.gross)}</div>
            <div class="metric-note">Tổng doanh thu của các phiên đã lọc</div>
          </div>
          <div class="metric">
            <div class="metric-top"><span>GMV sau hoàn / hủy</span><span class="metric-icon tone-emerald">${icon('wallet')}</span></div>
            <div class="metric-value">${moneyShort(net)}</div>
            <div class="metric-note">Cơ sở KPI tạm tính</div>
          </div>
          <div class="metric">
            <div class="metric-top"><span>Tổng đơn bán ra</span><span class="metric-icon tone-blue">${icon('shopping-bag')}</span></div>
            <div class="metric-value">${t.orders}</div>
            <div class="metric-note">Tổng đơn từ các phiên đã chọn</div>
          </div>
          <div class="metric">
            <div class="metric-top"><span>Tỷ lệ hủy đơn</span><span class="metric-icon tone-rose">${icon('percent')}</span></div>
            <div class="metric-value">${pct(cancelRate)}</div>
            <div class="metric-good">Host KPI 0,3% • Vận hành 0,1%</div>
          </div>
        </section>

        <section class="grid-2">
          <div class="panel">
            <div class="panel-head">
              <div>
                <h3>Biến động GMV theo phiên LIVE</h3>
                <div class="mini">Minh họa nhanh để duyệt bố cục dashboard</div>
              </div>
              <span class="pill purple">${rows.length} phiên • 20 phiên mỗi trang</span>
            </div>
            <div class="bar-chart">
              ${rows.slice(0,6).map(x=>`<div class="bar" style="height:${Math.max(30,(x.gross/130000000)*170)}px"><span>${moneyShort(x.gross)}</span></div>`).join('')}
            </div>
            <div class="axis">
              ${rows.slice(0,6).map(x=>`<span>${x.start.split(' ')[1]}</span>`).join('')}
            </div>
          </div>
          <div class="panel">
            <div class="panel-head">
              <div>
                <h3>Top Host theo GMV ròng</h3>
                <div class="mini">Dựa trên gắn thẻ Host hiện tại của từng phiên LIVE</div>
              </div>
            </div>
            <div class="legend-list">
              ${topHosts.map(h=>`<div class="legend-item"><div><b>${h.host}</b><div class="mini">${h.count} phiên LIVE</div></div><div style="text-align:right"><b>${money(h.net)}</b><div class="mini">KPI Host: ${money(h.net*0.003)}</div></div></div>`).join('')}
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Ghi chú triển khai thật</h3>
              <div class="mini">Những điểm cần giữ đúng khi kết nối TikTok API thật</div>
            </div>
          </div>
          <div class="note">
            • Chỉ tính LIVE của <b>Mẹ Khang Sữa</b> và <b>Shop KhangBaby</b> trong Tổng quan và KPI Host. LIVE của đối tác Affiliate hiển thị ở tab riêng.<br>
            • GMV sau hoàn/hủy phải tách riêng với GMV đã ghi nhận để tránh nhầm khi tính KPI.<br>
            • Cần theo dõi đối soát sau LIVE vì khách có thể hủy đơn hoặc hoàn đơn trong thời gian chính sách.<br>
            • Host đã được gắn tag trực tiếp ở từng phiên LIVE: <b>Thảo My</b>, <b>Dung</b>, <b>Tâm</b>.<br>
            • Pair KPI hiện dùng quy tắc: <b>Thảo My ↔ Hùng Bắc Giang</b>; <b>Dung ↔ Hùng Hiền Hòa</b>; <b>Tâm ↔ Hùng Hiền Hòa</b>.
          </div>
        </section>`;
    }

    function liveRow(x){
      const net = x.gross - x.refund;
      const hostOptions = HOSTS.map(h=>`<option value="${h}" ${x.host===h?'selected':''}>${h}</option>`).join('');
      return `
        <div class="live-row">
          <div class="live-col-main">
            <div class="live-stack">
              <div class="live-title">${x.title}</div>
              <div class="live-id">ID: ${x.id}</div>
              <div class="mini">Kênh: ${x.channel}</div>
            </div>
          </div>
          <div class="host-column">
            <div class="live-stack">
              <div class="mobile-label">HOST LIVE</div>
              <div class="host-compact" title="Vận hành: ${PAIRS[x.host]}">
                <span class="host-compact-icon" aria-hidden="true"></span>
                <select class="host-compact-select" aria-label="Gắn Host cho phiên ${x.id}" onchange="updateHost('${x.id}', this.value)" ${!hasPermission('editHosts')?'disabled title="Tài khoản không được sửa Host"':''}>${hostOptions}</select>
              </div>
            </div>
          </div>
          <div>
            <div class="live-stack">
              <div class="mobile-label">Thời gian LIVE</div>
              <div class="live-value">${liveTimeRange(x)}</div>
            </div>
          </div>
          <div>
            <div class="live-stack">
              <div class="mobile-label">Thời lượng LIVE</div>
              <div class="live-value live-duration">${fullDuration(x.duration)}</div>
            </div>
          </div>
          <div>
            <div class="live-stack">
              <div class="mobile-label">GMV đã ghi nhận</div>
              <div class="live-value live-money">${money(x.gross)}</div>
            </div>
          </div>
          <div>
            <div class="live-stack">
              <div class="mobile-label">GMV sau hoàn hủy</div>
              <div class="live-value live-money">${money(net)}</div>
            </div>
          </div>
          <div>
            <div class="live-stack">
              <div class="mobile-label">Số món bán ra</div>
              <div class="live-value">${x.orders}</div>
            </div>
          </div>
          <div>
            <div class="live-stack">
              <div class="mobile-label">Số món sau hoàn hủy</div>
              <div class="live-value">${ordersAfterCancel(x)}</div>
            </div>
          </div>
        </div>`;
    }

    function setLiveSort(field, direction){
      if(state.liveSortField === field && state.liveSortDirection === direction){
        state.liveSortField = '';
        state.liveSortDirection = '';
      } else {
        state.liveSortField = field;
        state.liveSortDirection = direction;
      }
      state.livePage = 1;
      render();
    }

    function cycleLiveSort(field){
      if(state.liveSortField !== field){
        state.liveSortField = field;
        state.liveSortDirection = 'desc';
      } else if(state.liveSortDirection === 'desc'){
        state.liveSortDirection = 'asc';
      } else {
        state.liveSortField = '';
        state.liveSortDirection = '';
      }
      state.livePage = 1;
      render();
    }

    function liveSortHeader(field, label){
      const isActive = state.liveSortField === field;
      const direction = isActive ? state.liveSortDirection : '';
      const tip = direction === 'desc' ? 'Đang xếp cao xuống thấp. Bấm để xếp thấp lên cao' : direction === 'asc' ? 'Đang xếp thấp lên cao. Bấm để bỏ sắp xếp' : 'Bấm để xếp cao xuống thấp';
      return `<div class="sort-heading">
        <span class="sort-title">${label}</span>
        <span class="sort-controls">
          <button type="button" class="sort-mini" title="${tip}" aria-label="${label}: ${tip}" onclick="cycleLiveSort('${field}')">
            <svg viewBox="0 0 16 20" width="14" height="18" aria-hidden="true" focusable="false">
              <path class="sort-up ${direction==='asc'?'on':''}" d="M4 7 L8 3 L12 7" />
              <path class="sort-down ${direction==='desc'?'on':''}" d="M4 13 L8 17 L12 13" />
            </svg>
          </button>
        </span>
      </div>`;
    }

    function renderLives(){
      const rows = filteredLives().slice();
      if(state.liveSortField){
        const field = state.liveSortField;
        const mult = state.liveSortDirection === 'asc' ? 1 : -1;
        const amount = x => field === 'net' ? x.gross - x.refund : x.gross;
        rows.sort((a,b)=>mult * (amount(a)-amount(b)) || (parseDMYHM(b.start)-parseDMYHM(a.start)));
      }
      const perPage = 20;
      const pages = Math.max(1,Math.ceil(rows.length/perPage));
      state.livePage = Math.min(Math.max(1,state.livePage),pages);
      const startIndex = (state.livePage-1)*perPage;
      const shown = rows.slice(startIndex,startIndex+perPage);
      return `
        <section class="panel" style="padding:0;overflow:hidden">
          <div style="padding:18px 18px 10px">
            <div class="panel-head" style="margin-bottom:8px">
              <div>
                <h3>Danh sách phiên LIVE đã kết thúc</h3>
                <div class="mini live-table-caption">Chỉ hai kênh Mẹ Khang Sữa và Shop KhangBaby • Gắn Host cho từng phiên • Không gồm Affiliate</div>
              </div>
              <span class="pill purple">${rows.length} phiên</span>
            </div>
          </div>
          <div class="live-wrapper">
            <div class="live-header">
              <div>LIVE</div>
              <div>HOST LIVE</div>
              <div>Thời gian LIVE</div>
              <div>Thời lượng LIVE</div>
              ${liveSortHeader('gross','GMV đã ghi nhận')}
              ${liveSortHeader('net','GMV sau hoàn hủy')}
              <div>Số món bán ra</div>
              <div>Số món sau hoàn hủy</div>
            </div>
            ${shown.map(liveRow).join('')}
          </div>
          <div class="live-pager" aria-label="Phân trang phiên LIVE">
            <span>Hiển thị ${rows.length ? startIndex+1 : 0}–${Math.min(startIndex+perPage,rows.length)} / ${rows.length} phiên</span>
            <div class="page-actions">
              <button class="btn ghost" onclick="changeLivePage(-1)" ${state.livePage===1?'disabled':''}>${icon('chevron-left')} Trước</button>
              <span>Trang ${state.livePage}/${pages}</span>
              <button class="btn ghost" onclick="changeLivePage(1)" ${state.livePage===pages?'disabled':''}>Sau ${icon('chevron-right')}</button>
            </div>
          </div>
        </section>
        <section class="panel" style="margin-top:16px">
          <div class="panel-head"><div><h3>Lưu ý sử dụng</h3><div class="mini">Khi đổi Host ở một phiên LIVE, phần KPI Host & vận hành sẽ cập nhật ngay theo cặp tương ứng.</div></div></div>
          <div class="note">
            • Host gắn thẻ có thể đổi trực tiếp từng phiên: <b>Thảo My</b>, <b>Dung</b>, <b>Tâm</b>.<br>
            • Thảo My sẽ tính KPI cùng <b>Hùng Bắc Giang</b>.<br>
            • Dung và Tâm sẽ tính KPI cùng <b>Hùng Hiền Hòa</b>, và KPI 0,1% của Hùng Hiền Hòa sẽ được cộng dồn từ cả 2 Host này.
          </div>
        </section>`;
    }

    function changeLivePage(delta){
      state.livePage += delta;
      render();
      window.scrollTo({top:0,behavior:'smooth'});
    }

    function cycleAffiliateSort(field){
      if(state.affiliateSortField !== field){
        state.affiliateSortField = field;
        state.affiliateSortDirection = 'desc';
      } else if(state.affiliateSortDirection === 'desc'){
        state.affiliateSortDirection = 'asc';
      } else {
        state.affiliateSortField = '';
        state.affiliateSortDirection = '';
      }
      state.affiliatePage = 1;
      render();
    }

    function affiliateSortHeader(field, label){
      const isActive = state.affiliateSortField === field;
      const direction = isActive ? state.affiliateSortDirection : '';
      const tip = direction === 'desc' ? 'Đang xếp cao xuống thấp. Bấm để xếp thấp lên cao' : direction === 'asc' ? 'Đang xếp thấp lên cao. Bấm để bỏ sắp xếp' : 'Bấm để xếp cao xuống thấp';
      return `<div class="sort-heading">
        <span class="sort-title">${label}</span>
        <span class="sort-controls">
          <button type="button" class="sort-mini" title="${tip}" aria-label="${label}: ${tip}" onclick="cycleAffiliateSort('${field}')">
            <svg viewBox="0 0 16 20" width="14" height="18" aria-hidden="true" focusable="false">
              <path class="sort-up ${direction==='asc'?'on':''}" d="M4 7 L8 3 L12 7" />
              <path class="sort-down ${direction==='desc'?'on':''}" d="M4 13 L8 17 L12 13" />
            </svg>
          </button>
        </span>
      </div>`;
    }

    // V47: dòng đơn/SKU mẫu, lưu snapshot tỷ lệ tại thời điểm phát sinh.
    const affiliateLedger=AffiliateCommission.create(demoAffiliateLives,window.localStorage);
    state.affShowAllItems=false;
    function affiliateSessionCommission(id){return affiliateLedger.stats(id);}
    function persistAffiliateItem(itemId){
      if(!hasPermission('manageAPI')){toast('Cần quyền quản trị nguồn dữ liệu để sửa bản đối soát.', 'error');return;}
      const line=document.querySelector('[data-aff-item="'+itemId+'"]');
      if(!line)return;
      const rawRefund=line.querySelector('[data-field="refund"]').value;
      const rawConfirmed=line.querySelector('[data-field="confirmed"]').value;
      const status=line.querySelector('[data-field="status"]').value;
      if(rawRefund.trim()===''||!/^\d+$/.test(rawRefund.trim())||rawConfirmed.trim()!==''&&!/^\d+$/.test(rawConfirmed.trim())){
        toast('Nhập số tiền nguyên không âm, không có dấu phân tách.', 'error', 'Giá trị không hợp lệ');return;
      }
      try {
        affiliateLedger.updateItem(itemId,{refundVnd:Number(rawRefund),status,tiktokConfirmedVnd:rawConfirmed.trim()===''?null:Number(rawConfirmed)});
        toast('Đã lưu điều chỉnh dòng đơn vào dữ liệu demo. Dòng tiền thật cần đối soát API TikTok.','success','Đã cập nhật mô phỏng');
        render();
      }catch(e){toast(configSafe(e.message),'error','Không thể lưu');}
    }
    function persistAffiliateSku(skuId){
      if(!hasPermission('manageAPI')){toast('Chỉ người quản lý nguồn dữ liệu được sửa tỷ lệ.','error');return;}
      const field=document.querySelector('[data-aff-rate="'+skuId+'"]');if(!field)return;
      try {
        const dt=toInputDate(new Date());
        affiliateLedger.saveRate(skuId,field.value,dt);
        toast('Lưu mức hoa hồng mới từ hôm nay. Đơn hàng cũ giữ nguyên mức tại lúc bán.','success','Đã lưu tỷ lệ SKU');
        render();
      }catch(e){toast(configSafe(e.message),'error','Không thể lưu');}
    }
    function resetAffiliateLedgerDemo(){
      if(!hasPermission('manageAPI'))return;
      if(!window.confirm('Khôi phục tỷ lệ SKU và đối soát dữ liệu MẪU ban đầu?'))return;
      affiliateLedger.reset();state.affShowAllItems=false;render();
      toast('Đã khôi phục dữ liệu hoa hồng minh họa.','success');
    }
    function exportAffiliateItemCSV(){
      const ids=new Set(affiliateRows().map(x=>x.id));
      const rows=affiliateLedger.allItems().filter(x=>ids.has(x.sessionId));
      const records=[['Mã đơn mẫu','Mã dòng','Phiên','SKU','Ngày bán','Giá trị thực trả','Hoàn tiền','Tỷ lệ tại lúc bán (%)','Phiên bản tỷ lệ','Hoa hồng ước tính','Hoa hồng sau hoàn/hủy','Hoa hồng TikTok (nếu có)','Chênh lệch','Trạng thái đối soát'],...rows.map(x=>[x.orderId,x.id,x.sessionId,x.skuId,x.placedAt,x.paidVnd,x.refundVnd,x.rateBps/100,x.rateVersionId,x.estimated,x.adjusted,x.tiktokConfirmedVnd??'',x.difference??'',x.check])];
      const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
      const blob=new Blob(['\ufeff'+records.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
      const anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download='DATA_SHOPKHANGBABY_AFFILIATE_SKU_DEMO.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);
    }
    function renderAffiliateSkuControls(){
      const canEdit=hasPermission('manageAPI');
      const list=affiliateLedger.latestRates();
      return `<section class="panel aff-sku-panel">
        <div class="panel-head"><div><h3>${icon('percent','heading-icon')} Tỷ lệ hoa hồng theo từng SKU</h3><div class="mini">Có lịch sử phiên bản • tỷ lệ đã áp dụng cho đơn cũ không thay đổi. Tất cả đều là dữ liệu mẫu.</div></div><span class="pill purple">${list.length} SKU mẫu</span></div>
        <div class="aff-sku-grid">${list.map(x=>`<div class="aff-sku-card"><div class="aff-sku-name"><strong>${configSafe(x.name)}</strong><span>${configSafe(x.id)}</span></div><div class="aff-sku-bottom"><label class="aff-rate-edit"><span>Tỷ lệ hiện hành</span><input data-aff-rate="${x.id}" aria-label="Tỷ lệ ${configSafe(x.name)}" type="number" step="0.01" min="0" max="100" value="${x.rate.bps/100}" ${canEdit?'':'disabled'}></label><button type="button" class="btn ghost aff-save-rate" onclick="persistAffiliateSku('${x.id}')" ${canEdit?'':'disabled'}>${icon('save')} Lưu</button></div><small>Hiệu lực: ${configSafe(x.rate.effectiveFrom)} • ${x.rate.bps/100}%</small></div>`).join('')}</div>
        <details class="aff-rate-history"><summary>Lịch sử thay đổi tỷ lệ SKU (${affiliateLedger.getRateHistory().length} phiên bản)</summary><div class="aff-history-list">${affiliateLedger.getRateHistory().map(x=>`<div><span><b>${configSafe(x.skuId)}</b> • từ ${x.effectiveFrom}</span><strong>${x.bps/100}%</strong><span class="mini">${configSafe(x.source)}</span></div>`).join('')}</div></details>
        <div class="aff-helper"><span>Ví dụ: sản phẩm A 11% và B 15% được tính riêng theo từng dòng đơn. Khi chỉnh tỷ lệ, hệ thống chỉ áp dụng cho đơn mới từ ngày hiệu lực; không tính lại lịch sử.</span>${canEdit?`<button type="button" class="btn ghost" onclick="resetAffiliateLedgerDemo()">Khôi phục dữ liệu mẫu</button>`:''}</div>
      </section>`;
    }
    function renderAffiliateReconciliation(rows){
      const authorized=hasPermission('manageAPI');
      const keys=new Set(rows.map(x=>x.id));
      const records=affiliateLedger.allItems().filter(x=>keys.has(x.sessionId));
      const seen=state.affShowAllItems?records:records.slice(0,10);
      const total=records.reduce((acc,x)=>{acc.estimated+=x.estimated;acc.adjusted+=x.adjusted;if(x.check==='matched')acc.matched++;if(x.check==='mismatch')acc.mismatch++;if(x.check==='awaiting')acc.pending++;return acc;},{estimated:0,adjusted:0,matched:0,mismatch:0,pending:0});
      const pill=x=>x.check==='mismatch'?'<span class="pill warn">Chênh lệch</span>':x.check==='matched'?'<span class="pill ok">Đã khớp</span>':'<span class="pill purple">Chờ dữ liệu</span>';
      return `<section class="panel aff-ledger-panel">
        <div class="panel-head"><div><h3>${icon('receipt','heading-icon')} Đối soát hoa hồng theo đơn hàng / SKU</h3><div class="mini">Mỗi dòng có Order ID, SKU, tỷ lệ chốt khi bán, hoàn tiền và số TikTok xác nhận nếu có.</div></div><button class="btn ghost" onclick="exportAffiliateItemCSV()">${icon('download')} Xuất chi tiết CSV</button></div>
        <div class="aff-reconcile-strip"><span><strong>${money(total.estimated)}</strong><small>Hoa hồng trước hoàn</small></span><span><strong>${money(total.adjusted)}</strong><small>Hoa hồng sau hoàn</small></span><span><strong>${total.matched}</strong><small>Đã khớp</small></span><span><strong>${total.mismatch}</strong><small>Chênh lệch</small></span><span><strong>${total.pending}</strong><small>Chờ TikTok</small></span></div>
        <div class="note" style="margin-top:12px">Số xác nhận TikTok trong bản demo chỉ để thử chức năng đối soát. Trong hệ thống thật, kết quả API/đối soát là nguồn xác nhận; các thay đổi thủ công phải đi kèm quyền, lịch sử và chứng từ.</div>
        <div class="table-wrap"><table class="affiliate-table aff-ledger-table"><thead><tr><th>Đơn / Phiên</th><th>SKU / sản phẩm</th><th>Tiền thực trả</th><th>Tỷ lệ chốt</th><th>Hoàn tiền</th><th>Trạng thái</th><th>Hoa hồng sau hoàn</th><th>TikTok xác nhận</th><th>Đối soát</th>${authorized?'<th>Thao tác</th>':''}</tr></thead><tbody>
        ${seen.map(x=>`<tr data-aff-item="${x.id}"><td><b>${configSafe(x.orderId)}</b><div class="mini">${configSafe(x.sessionId)}</div></td><td><b>${configSafe(x.skuName)}</b><div class="mini">${configSafe(x.skuId)}</div></td><td>${money(x.paidVnd)}</td><td><b>${x.rateBps/100}%</b><div class="mini">${configSafe(x.rateVersionId)}</div></td><td>${authorized?`<input class="aff-money-input" aria-label="Hoàn tiền ${x.orderId}" data-field="refund" inputmode="numeric" value="${x.refundVnd}">`:money(x.refundVnd)}</td><td>${authorized?`<select class="aff-status-select" aria-label="Trạng thái ${x.orderId}" data-field="status">${[['pending','Chờ hoàn tất'],['partial_refund','Hoàn một phần'],['cancelled','Hủy / hoàn toàn bộ'],['delivered','Đã giao'],['settled','Đã quyết toán']].map(p=>`<option value="${p[0]}" ${x.status===p[0]?'selected':''}>${p[1]}</option>`).join('')}</select>`:configSafe(x.status)}</td><td><b>${money(x.adjusted)}</b></td><td>${authorized?`<input class="aff-money-input" aria-label="Hoa hồng TikTok ${x.orderId}" data-field="confirmed" inputmode="numeric" placeholder="Chưa có" value="${x.tiktokConfirmedVnd??''}">`:x.tiktokConfirmedVnd===null?'Chờ dữ liệu':money(x.tiktokConfirmedVnd)}</td><td>${pill(x)}${x.check==='mismatch'?`<div class="mini">Chênh ${money(x.difference)}</div>`:''}</td>${authorized?`<td><button class="btn ghost" type="button" onclick="persistAffiliateItem('${x.id}')">Lưu</button></td>`:''}</tr>`).join('')||'<tr><td colspan="10">Không có dữ liệu SKU trong bộ lọc hiện tại.</td></tr>'}
        </tbody></table></div>
        <div class="aff-table-foot"><span>Hiển thị ${seen.length}/${records.length} dòng đơn minh họa</span>${records.length>10?`<button class="btn ghost" type="button" onclick="state.affShowAllItems=!state.affShowAllItems;render()">${state.affShowAllItems?'Thu gọn 10 dòng':'Xem tất cả '+records.length+' dòng'}</button>`:''}</div>
        <details class="aff-rate-history aff-audit-panel"><summary>Nhật ký điều chỉnh trong bản demo (${affiliateLedger.getAudit().length})</summary><div class="aff-history-list">${affiliateLedger.getAudit().slice(0,20).map(x=>`<div><b>${configSafe(x.action)}</b><span>${configSafe(x.reference)}</span><span class="mini">${configSafe(x.at)}</span></div>`).join('')||'<div class="mini">Chưa có thay đổi.</div>'}</div></details>
      </section>`;
    }

    function affiliateRows(){
      const q=state.affiliateSearch.toLowerCase().trim();
      const today=new Date();today.setHours(0,0,0,0);
      const list=demoAffiliateLives.filter(a=>{
        if(q && !(a.creator+' '+a.handle+' '+a.title+' '+a.id).toLowerCase().includes(q))return false;
        if(state.affiliateDate==='all')return true;
        const started=parseDMYHM(a.start);
        if(!started)return false;
        const day=new Date(started.getFullYear(),started.getMonth(),started.getDate());
        if(state.affiliateDate==='custom'){
          const from=parseInputDate(state.affiliateStart);
          const to=parseInputDate(state.affiliateEnd);
          return !!from && !!to && day>=from && day<=to;
        }
        const days=Number(state.affiliateDate);
        return day>=new Date(today.getFullYear(),today.getMonth(),today.getDate()-(days-1)) && day<=today;
      });
      const enriched=list.map(a=>{
        const st=affiliateSessionCommission(a.id);
        const items=affiliateLedger.forSession(a.id);
        return {...a, gross:items.reduce((v,x)=>v+x.paidVnd,0), refund:items.reduce((v,x)=>v+x.refundVnd,0), returned:items.filter(x=>x.refundVnd>0).length, commission:st.adjusted, estimatedCommission:st.estimated, confirmedCommission:st.confirmed};
      });
      list.length=0;list.push(...enriched);
      if(state.affiliateSortField){
        const field = state.affiliateSortField;
        const mult = state.affiliateSortDirection === 'asc' ? 1 : -1;
        const amount = x => field === 'net' ? x.gross - x.refund : x.gross;
        list.sort((a,b)=>mult * (amount(a)-amount(b)) || (parseDMYHM(b.start)-parseDMYHM(a.start)));
      } else {
        list.sort((a,b)=>parseDMYHM(b.start)-parseDMYHM(a.start));
      }
      return list;
    }

    function renderAffiliate(){
      const all=affiliateRows();
      const t=all.reduce((r,x)=>({gross:r.gross+x.gross,refund:r.refund+x.refund,orders:r.orders+x.orders,returned:r.returned+x.returned,commission:r.commission+x.commission}),{gross:0,refund:0,orders:0,returned:0,commission:0});
      const net=t.gross-t.refund;
      const creatorCount=new Set(all.map(x=>x.handle)).size;
      const totalPages=Math.max(1,Math.ceil(all.length/20));
      state.affiliatePage=Math.min(state.affiliatePage,totalPages);
      const from=(state.affiliatePage-1)*20;
      const current=all.slice(from,from+20);
      return `
        <section class="note" style="margin-bottom:16px"><b>Tab LIVE Affiliate — riêng biệt với LIVE chính thức</b><div>Chỉ dữ liệu mẫu để duyệt giao diện. Các đối tác, tài khoản, đơn hàng và doanh thu dưới đây đều giả lập. Khi nối TikTok API cần xác minh quyền dữ liệu từng nhà sáng tạo, đơn hàng quy gán và báo cáo phiên LIVE được phép truy xuất. Không cộng các số này vào Tổng quan hoặc KPI Host chính thức.</div></section>
        <div class="metrics affiliate-metrics">
          <div class="metric"><div class="metric-top"><span>GMV Affiliate ghi nhận</span><span class="metric-icon tone-violet">${icon('banknote')}</span></div><div class="metric-value">${money(t.gross)}</div><div class="metric-note">Doanh thu quy gán Affiliate (mẫu)</div></div>
          <div class="metric"><div class="metric-top"><span>GMV sau hoàn / hủy</span><span class="metric-icon tone-emerald">${icon('wallet')}</span></div><div class="metric-value">${money(net)}</div><div class="metric-note">Tạm tính, chưa chốt với TikTok</div></div>
          <div class="metric"><div class="metric-top"><span>Đơn Affiliate</span><span class="metric-icon tone-blue">${icon('shopping-bag')}</span></div><div class="metric-value">${t.orders.toLocaleString('vi-VN')}</div><div class="metric-note">${creatorCount} đối tác • ${all.length} phiên minh họa</div></div>
          <div class="metric"><div class="metric-top"><span>Hoa hồng sau hoàn/hủy (SKU)</span><span class="metric-icon tone-amber">${icon('percent')}</span></div><div class="metric-value">${money(t.commission)}</div><div class="metric-note">Tạm tính theo tỷ lệ mỗi SKU lúc bán • chưa phải quyết toán</div></div>
        </div>
        <section class="panel affiliate-panel">
          <div class="panel-head"><div><h3>${icon('users','heading-icon')} Danh sách đối tác và phiên LIVE Affiliate</h3><div class="mini">Xem đối tác nào đang đóng góp doanh thu từ sản phẩm của shop</div></div><span class="pill purple">${all.length} phiên minh họa</span></div>
          <div class="mini affiliate-scroll-hint">Vuốt ngang bảng để xem đầy đủ doanh số, đơn hàng, hoa hồng và trạng thái.</div>
          <div class="table-wrap"><table class="affiliate-table">
            <thead><tr><th>Nhà sáng tạo / Kênh</th><th>Phiên LIVE</th><th>Thời gian</th><th>Thời lượng</th><th>${affiliateSortHeader('gross','GMV đã ghi nhận')}</th><th>${affiliateSortHeader('net','GMV sau hoàn hủy')}</th><th>Số đơn</th><th>Hoa hồng sau hoàn/hủy</th><th>Trạng thái</th></tr></thead>
            <tbody>${current.length?current.map(a=>`<tr>
              <td><b>${configSafe(a.creator)}</b><div class="mini">${configSafe(a.handle)}</div></td>
              <td><b>${configSafe(a.title)}</b><div class="mini">${configSafe(a.id)}</div></td>
              <td>${configSafe(a.start)}</td><td>${configSafe(a.duration)}</td>
              <td><b>${money(a.gross)}</b></td><td><b>${money(a.gross-a.refund)}</b></td>
              <td>${a.orders}</td><td>${money(a.commission)}</td><td><span class="pill warn">${configSafe(a.status)}</span></td>
            </tr>`).join(''):'<tr><td colspan="9" class="affiliate-empty">Không có phiên Affiliate trong bộ lọc đang chọn.</td></tr>'}</tbody>
          </table></div>
          <div class="live-pager"><span>Hiển thị ${all.length?from+1:0}–${Math.min(from+20,all.length)} / ${all.length} phiên</span>
            <div class="page-actions"><button class="btn ghost" onclick="changeAffiliatePage(-1)" ${state.affiliatePage<=1?'disabled':''}>${icon('chevron-left')} Trước</button><span>Trang ${state.affiliatePage}/${totalPages}</span><button class="btn ghost" onclick="changeAffiliatePage(1)" ${state.affiliatePage>=totalPages?'disabled':''}>Sau ${icon('chevron-right')}</button></div>
          </div>
        </section>
        ${renderAffiliateSkuControls()}
        ${renderAffiliateReconciliation(all)}
        <section class="panel" style="margin-top:16px"><div class="panel-head"><div><h3>Phân tích đối tác Affiliate</h3><div class="mini">Xếp hạng theo GMV Affiliate sau hoàn hủy của các phiên minh họa</div></div></div>
        <div class="affiliate-rank">${Array.from(new Set(all.map(x=>x.handle))).map(handle=>{
          const partner=all.filter(x=>x.handle===handle);
          return {name:partner[0].creator,handle,net:partner.reduce((sum,x)=>sum+x.gross-x.refund,0),orders:partner.reduce((sum,x)=>sum+x.orders,0),count:partner.length};
        }).sort((a,b)=>b.net-a.net).map((p,i)=>`<div class="affiliate-rank-row"><span class="rank-num">${i+1}</span><span class="partner-name"><b>${configSafe(p.name)}</b><span class="mini">${configSafe(p.handle)} • ${p.count} phiên</span></span><span class="partner-sales"><b>${money(p.net)}</b><span class="mini">${p.orders} đơn</span></span></div>`).join('') || '<div class="mini">Không có dữ liệu để xếp hạng.</div>'}</div></section>`;
    }
    function leaderboardEntries(scope=state.leaderScope){
      const channels=new Map();
      const creators=new Map();
      state.liveData.filter(x=>OFFICIAL_CHANNELS.some(ch=>ch.toLocaleLowerCase('vi-VN')===String(x.channel||'').toLocaleLowerCase('vi-VN').trim()) && matchSelectedDate(x.start)).forEach(x=>{
        const key=String(x.channel||'').trim();
        if(!channels.has(key)) channels.set(key,{kind:'channel',name:key,subtitle:'Kênh LIVE chính thức',gross:0,refund:0,net:0,orders:0,sessions:0});
        const row=channels.get(key);
        row.gross+=x.gross;
        row.refund+=x.refund;
        row.net+=x.gross-x.refund;
        row.orders+=ordersAfterCancel(x);
        row.sessions++;
      });
      demoAffiliateLives.filter(x=>matchSelectedDate(x.start)).forEach(x=>{
        const key=x.handle;
        if(!creators.has(key)) creators.set(key,{kind:'creator',name:x.creator,subtitle:key,gross:0,refund:0,net:0,orders:0,sessions:0});
        const row=creators.get(key);
        row.gross+=x.gross;
        row.refund+=x.refund;
        row.net+=x.gross-x.refund;
        row.orders+=Math.max(0,x.orders-x.returned);
        row.sessions++;
      });
      const rows=[];
      if(scope!=='creator') rows.push(...channels.values());
      if(scope!=='channel') rows.push(...creators.values());
      const key=state.leaderSort==='orders'?'orders':'net';
      return rows.sort((a,b)=>(b[key]-a[key]) || (b.net-a.net) || a.name.localeCompare(b.name,'vi'));
    }

    function renderLeaders(){
      const rows=leaderboardEntries();
      const allRows=leaderboardEntries('all');
      const detailRows=rows.slice();
      if(state.leaderDetailSortField){
        const mult=state.leaderDetailSortDirection==='asc'?1:-1;
        const field=state.leaderDetailSortField;
        detailRows.sort((a,b)=>mult*(a[field]-b[field]) || a.name.localeCompare(b.name,'vi'));
      }
      const official=allRows.filter(x=>x.kind==='channel').sort((a,b)=>b.net-a.net);
      const affiliate=allRows.filter(x=>x.kind==='creator').sort((a,b)=>b.net-a.net);
      const officialNet=official.reduce((sum,x)=>sum+x.net,0);
      const affiliateNet=affiliate.reduce((sum,x)=>sum+x.net,0);
      const leader=rows[0];
      const maxValue=Math.max(1,...rows.map(x=>state.leaderSort==='orders'?x.orders:x.net));
      const criterion=state.leaderSort==='orders'?'số đơn sau hoàn/hủy':'GMV sau hoàn/hủy';
      const quantity=value=>Number(value||0).toLocaleString('vi-VN');
      const title=x=>x.kind==='creator'?'Nhà sáng tạo Affiliate':'Kênh LIVE chính thức';
      const topCard=(label,items,kind)=>{
        const first=items[0];
        return `<div class="rank-feature rank-feature-${kind}">
          <div class="rank-feature-top"><span class="rank-feature-icon">${icon(kind==='creator'?'users':'video')}</span><span class="rank-feature-kicker">${label}</span></div>
          <div class="rank-feature-name">${first?configSafe(first.name):'Chưa có dữ liệu'}</div>
          <div class="rank-feature-money">${first?money(first.net):'—'}</div>
          <div class="rank-feature-sub">${first?`${quantity(first.orders)} đơn hàng · ${quantity(first.sessions)} phiên LIVE`:'Chưa có phiên trong khoảng thời gian đang chọn'}</div>
        </div>`;
      };
      return `
        <section class="rank-intro">
          <div class="rank-intro-main">
            <div class="rank-kicker">${icon('target')} XẾP HẠNG HIỆU SUẤT LIVE</div>
            <h2>Ai đang bán hàng hiệu quả nhất?</h2>
            <p>So sánh Nhà sáng tạo Affiliate và hai kênh LIVE chính thức theo doanh số sau hoàn hủy hoặc số đơn bán ra.</p>
          </div>
          <span class="rank-demo-label">${icon('info')} Dữ liệu minh họa</span>
        </section>

        <section class="rank-stats" aria-label="Tổng quan xếp hạng">
          <div class="rank-stat"><div class="rank-stat-top"><span>Kênh LIVE chính thức</span><span class="rank-stat-icon channel">${icon('video')}</span></div><strong>${money(officialNet)}</strong><span>${official.length} kênh đang có dữ liệu</span></div>
          <div class="rank-stat"><div class="rank-stat-top"><span>Nhà sáng tạo Affiliate</span><span class="rank-stat-icon creator">${icon('users')}</span></div><strong>${money(affiliateNet)}</strong><span>${affiliate.length} nhà sáng tạo đang có dữ liệu</span></div>
          <div class="rank-stat"><div class="rank-stat-top"><span>Đứng đầu ${state.leaderSort==='orders'?'số đơn':'doanh số'}</span><span class="rank-stat-icon winner">${icon('target')}</span></div><strong class="rank-stat-person">${leader?configSafe(leader.name):'Chưa có dữ liệu'}</strong><span>${leader?(state.leaderSort==='orders'?`${quantity(leader.orders)} đơn sau hoàn/hủy`:money(leader.net)):'Thử đổi bộ lọc thời gian'}</span></div>
        </section>

        <section class="rank-main-grid">
          <div class="rank-panel rank-chart-panel">
            <div class="rank-panel-heading"><div><h3>Bảng xếp hạng</h3><p>Sắp xếp theo ${criterion}; mỗi thanh thể hiện giá trị so với hạng đầu.</p></div><span class="rank-count">${rows.length} đối tượng</span></div>
            ${rows.length?`<div class="rank-bars">${rows.map((x,i)=>{
              const current=state.leaderSort==='orders'?x.orders:x.net;
              const percent=Math.max(0,Math.min(100,current/maxValue*100));
              return `<div class="rank-bar-item">
                <div class="rank-bar-header">
                  <span class="rank-bar-index ${i===0?'first':''}">${i+1}</span>
                  <div class="rank-bar-person"><b>${configSafe(x.name)}</b><span>${configSafe(x.subtitle)} · ${title(x)}</span></div>
                  <strong class="rank-bar-value">${state.leaderSort==='orders'?`${quantity(x.orders)} đơn`:money(x.net)}</strong>
                </div>
                <div class="rank-bar-track" role="img" aria-label="${configSafe(x.name)}: ${state.leaderSort==='orders'?`${quantity(x.orders)} đơn`:money(x.net)}"><div class="rank-bar-fill ${x.kind==='creator'?'creator':'channel'}" style="width:${percent.toFixed(1)}%"></div></div>
              </div>`;
            }).join('')}</div>`:`<div class="rank-empty">${icon('calendar')}<b>Chưa có dữ liệu trong khoảng ngày này</b><span>Hãy thử khoảng thời gian dài hơn để xem bảng xếp hạng.</span></div>`}
            <div class="rank-legend"><span><i class="rank-legend-dot channel"></i>Kênh chính thức</span><span><i class="rank-legend-dot creator"></i>Affiliate</span></div>
          </div>
          <aside class="rank-side">
            <div class="rank-panel-heading rank-side-heading"><div><h3>Nổi bật theo nhóm</h3><p>Người dẫn đầu ở từng nguồn doanh số</p></div></div>
            ${topCard('TOP KÊNH CHÍNH THỨC',official,'channel')}
            ${topCard('TOP NHÀ SÁNG TẠO',affiliate,'creator')}
            <div class="rank-source-note">${icon('info')}<span><b>Lưu ý đối soát:</b> GMV kênh chính thức và GMV Affiliate có thể trùng đơn. Hai nguồn được hiển thị để so sánh, <b>không cộng gộp</b> thành doanh thu shop.</span></div>
          </aside>
        </section>

        <section class="rank-panel rank-detail-panel">
          <div class="rank-panel-heading"><div><h3>Chi tiết doanh số & đơn hàng</h3><p>Đầy đủ giá trị tiền, số phiên và số đơn sau hoàn hủy.</p></div><span class="rank-count">${rows.length} kết quả</span></div>
          <div class="table-wrap rank-desktop-table"><table class="leader-table rank-table"><thead><tr><th>Hạng</th><th>Nhà sáng tạo / Kênh</th><th>Loại</th><th class="rank-th-number">Số phiên</th><th class="rank-th-number">Số đơn</th><th class="rank-th-number">${reportGmvSortHeader('leaders','gross','GMV đã ghi nhận')}</th><th class="rank-th-number">Giá trị hoàn/hủy</th><th class="rank-th-number">${reportGmvSortHeader('leaders','net','GMV sau hoàn hủy')}</th></tr></thead><tbody>
            ${detailRows.map((x,i)=>`<tr><td><span class="rank-table-pos ${i===0?'is-best':''}">${i+1}</span></td><td><b>${configSafe(x.name)}</b><div class="mini">${configSafe(x.subtitle)}</div></td><td><span class="rank-type-badge ${x.kind}">${x.kind==='creator'?'Affiliate':'Chính thức'}</span></td><td class="rank-th-number">${quantity(x.sessions)}</td><td class="rank-th-number">${quantity(x.orders)}</td><td class="rank-th-number">${money(x.gross)}</td><td class="rank-th-number rank-refund">${money(x.refund)}</td><td class="rank-th-number rank-net"><b>${money(x.net)}</b></td></tr>`).join('') || '<tr><td colspan="8" class="leader-empty">Không có kết quả trong khoảng ngày được chọn.</td></tr>'}
          </tbody></table></div>
          <div class="rank-mobile-cards">${detailRows.map((x,i)=>`<div class="rank-mobile-card"><div class="rank-mobile-card-head"><span class="rank-table-pos ${i===0?'is-best':''}">${i+1}</span><div><b>${configSafe(x.name)}</b><span>${configSafe(x.subtitle)}</span></div><span class="rank-type-badge ${x.kind}">${x.kind==='creator'?'Affiliate':'Chính thức'}</span></div><div class="rank-mobile-card-net"><span>GMV sau hoàn hủy</span><strong>${money(x.net)}</strong></div><div class="rank-mobile-card-data"><div><span>GMV đã ghi nhận</span><b>${money(x.gross)}</b></div><div><span>Hoàn / hủy</span><b>${money(x.refund)}</b></div><div><span>Số đơn</span><b>${quantity(x.orders)}</b></div><div><span>Số phiên</span><b>${quantity(x.sessions)}</b></div></div></div>`).join('')||'<div class="rank-empty">Không có kết quả trong khoảng ngày được chọn.</div>'}</div>
        </section>`;
    }

    function exportLeaderboardCSV(){
      const rows=leaderboardEntries();
      const quoted=value=>'"'+String(value??'').replace(/"/g,'""').replace(/^([=+@-])/,'\'$1')+'"';
      const headers=['Hạng','Nhà sáng tạo / Kênh','Loại','Số phiên','Số đơn','GMV đã ghi nhận','Hoàn hủy','GMV sau hoàn hủy'];
      const lines=[headers,...rows.map((x,i)=>[i+1,x.name,x.kind==='creator'?'Affiliate':'Kênh chính thức',x.sessions,x.orders,x.gross,x.refund,x.net])];
      const blob=new Blob(['\ufeff'+lines.map(line=>line.map(quoted).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});
      const anchor=document.createElement('a');
      anchor.href=URL.createObjectURL(blob);
      anchor.download='DATA_SHOPKHANGBABY_TOP_XEP_HANG_DEMO.csv';
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    }

    function changeAffiliatePage(delta){
      state.affiliatePage=Math.max(1,Math.min(Math.ceil(affiliateRows().length/20)||1,state.affiliatePage+delta));
      render();
    }
    function exportAffiliateCSV(){
      const rows=affiliateRows();
      const lines=[['Nhà sáng tạo','Kênh Affiliate','Tên phiên','Thời gian','Thời lượng','GMV ghi nhận','GMV sau hoàn hủy','Số đơn','Số đơn hoàn hủy','Hoa hồng sau hoàn hủy tạm tính theo SKU','Trạng thái'],...rows.map(x=>[x.creator,x.handle,x.title,x.start,x.duration,x.gross,x.gross-x.refund,x.orders,x.returned,x.commission,x.status])];
      const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
      const blob=new Blob(['\ufeff'+lines.map(line=>line.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});
      const anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download='DATA_SHOPKHANGBABY_AFFILIATE_DEMO.csv';anchor.click();URL.revokeObjectURL(anchor.href);
    }

    function cycleReportGmvSort(report, field){
      const prefix=report==='orders'?'order':'leaderDetail';
      const key=prefix+'SortField', dir=prefix+'SortDirection';
      if(state[key]!==field){state[key]=field;state[dir]='desc';}
      else if(state[dir]==='desc')state[dir]='asc';
      else{state[key]='';state[dir]='';}
      render();
    }

    function reportGmvSortHeader(report, field, label){
      const prefix=report==='orders'?'order':'leaderDetail';
      const current=state[prefix+'SortField']===field ? state[prefix+'SortDirection'] : '';
      const tip=current==='desc'?'Giảm dần, bấm để tăng dần':current==='asc'?'Tăng dần, bấm để bỏ sắp xếp':'Bấm để sắp xếp cao xuống thấp';
      return `<span class="sort-heading"><span class="sort-title">${label}</span><span class="sort-controls">
        <button type="button" class="sort-mini" onclick="cycleReportGmvSort('${report}','${field}')" title="${tip}" aria-label="${label}: ${tip}" aria-pressed="${Boolean(current)}">
          <svg viewBox="0 0 16 20" width="13" height="17" aria-hidden="true" focusable="false">
            <path class="sort-up ${current==='asc'?'on':''}" d="M4 7 L8 3 L12 7"/>
            <path class="sort-down ${current==='desc'?'on':''}" d="M4 13 L8 17 L12 13"/>
          </svg>
        </button></span></span>`;
    }

    function renderOrders(){
      const rows = filteredLives().slice();
      if(state.orderSortField){
        const mult=state.orderSortDirection==='asc'?1:-1;
        const amount=x=>state.orderSortField==='net'?x.gross-x.refund:x.gross;
        rows.sort((a,b)=>mult*(amount(a)-amount(b)) || (parseDMYHM(b.start)-parseDMYHM(a.start)));
      }
      return `
        <section class="metrics">
          <div class="metric"><div class="metric-top"><span>Tổng hoàn / hủy</span><span class="metric-icon tone-rose">${icon('rotate')}</span></div><div class="metric-value">${moneyShort(totals(rows).refund)}</div><div class="metric-note">Khoản giảm trừ hiện tại</div></div>
          <div class="metric"><div class="metric-top"><span>Số đơn hủy</span><span class="metric-icon tone-amber">${icon('circle-x')}</span></div><div class="metric-value">${totals(rows).canceled}</div><div class="metric-note">Từ các phiên đã lọc</div></div>
          <div class="metric"><div class="metric-top"><span>Trạng thái đối soát</span><span class="metric-icon tone-emerald">${icon('check-square')}</span></div><div class="metric-value">Mở</div><div class="metric-note">Tiếp tục theo dõi sau LIVE</div></div>
          <div class="metric"><div class="metric-top"><span>Kỳ chốt mô phỏng</span><span class="metric-icon tone-blue">${icon('clock')}</span></div><div class="metric-value">15 ngày</div><div class="metric-note">Có thể phát sinh hoàn trả</div></div>
        </section>

        <section class="grid-2">
          <div class="panel">
            <div class="panel-head"><div><h3>Sổ đối soát từng phiên</h3><div class="mini">So sánh GMV đã ghi nhận, hoàn / hủy, GMV sau hoàn hủy và trạng thái chốt</div></div></div>
            <div class="table-wrap">
              <table class="reconcile-table">
                <thead>
                  <tr>
                    <th>Phiên LIVE</th>
                    <th>Host</th>
                    <th>${reportGmvSortHeader('orders','gross','GMV đã ghi nhận')}</th>
                    <th>Hoàn / hủy</th>
                    <th>${reportGmvSortHeader('orders','net','GMV sau hoàn hủy')}</th>
                    <th>Tỷ lệ hủy</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(x=>{
                    const net = x.gross - x.refund;
                    const rate = x.orders ? x.canceled / x.orders : 0;
                    const cls = x.status.includes('Đã chốt') ? 'ok' : (x.status.includes('Tiếp tục') ? 'warn' : 'purple');
                    return `<tr>
                      <td><b>${x.title}</b><div class="mini">${x.start}</div></td>
                      <td>${x.host}</td>
                      <td>${money(x.gross)}</td>
                      <td style="color:#c85f80">-${money(x.refund)}</td>
                      <td><b>${money(net)}</b></td>
                      <td>${pct(rate)}</td>
                      <td><span class="pill ${cls}">${x.status}</span></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head"><div><h3>Quy trình đối soát đề xuất</h3><div class="mini">Bố cục để bạn duyệt trước logic nghiệp vụ</div></div></div>
            <div class="setting"><div><b>1. Ghi nhận GMV sau LIVE</b><div class="mini">Lưu doanh thu ban đầu theo từng phiên đã kết thúc</div></div><span class="pill ok">Hoàn thành</span></div>
            <div class="setting"><div><b>2. Theo dõi hủy / hoàn đơn</b><div class="mini">Cập nhật biến động đơn hàng trong thời gian chính sách</div></div><span class="pill warn">Đang mở</span></div>
            <div class="setting"><div><b>3. Đối chiếu settlement</b><div class="mini">So khớp số thực nhận với dữ liệu TikTok / tài chính</div></div><span class="pill purple">Chờ API</span></div>
            <div class="setting"><div><b>4. Chốt KPI</b><div class="mini">Tính thưởng sau khi đủ điều kiện đối soát</div></div><span class="pill ok">Theo kỳ</span></div>
            <div class="note" style="margin-top:12px">Không nên lấy GMV vừa LIVE xong để chốt KPI ngay. Cần có cột trạng thái chờ đối soát / đã chốt để tránh sai số khi khách hủy và hoàn đơn sau đó.</div>
          </div>
        </section>`;
    }

    function renderAds(){
      const campaigns=[
        {name:'GMV Max • Livestream', objective:'Doanh số tối đa', source:'shopkhangbaby', status:'Đang chạy', spend:8400000, revenue:57120000, impressions:486000, clicks:14600, ctr:3.00, cpc:575, cpm:17284, orders:168, conversions:185, cvr:1.27, cpa:50000, atc:532, checkout:251, roas:6.8},
        {name:'Video Shopping • A', objective:'Chuyển đổi', source:'mekhangsua', status:'Cần tối ưu', spend:6200000, revenue:19220000, impressions:352000, clicks:7040, ctr:2.00, cpc:881, cpm:17614, orders:76, conversions:80, cvr:1.14, cpa:81579, atc:260, checkout:111, roas:3.1},
        {name:'Retargeting • B', objective:'Tiếp thị lại', source:'shopkhangbaby', status:'Đang chạy', spend:4000000, revenue:19600000, impressions:118000, clicks:4484, ctr:3.80, cpc:892, cpm:33898, orders:76, conversions:82, cvr:1.83, cpa:52632, atc:189, checkout:97, roas:4.9}
      ];
      const sum=campaigns.reduce((a,x)=>{a.spend+=x.spend;a.revenue+=x.revenue;a.impressions+=x.impressions;a.clicks+=x.clicks;a.orders+=x.orders;a.conversions+=x.conversions;a.atc+=x.atc;a.checkout+=x.checkout;return a;},{spend:0,revenue:0,impressions:0,clicks:0,orders:0,conversions:0,atc:0,checkout:0});
      const ctr=sum.impressions?sum.clicks/sum.impressions*100:0;
      const cpc=sum.clicks?sum.spend/sum.clicks:0;
      const cpm=sum.impressions?sum.spend/sum.impressions*1000:0;
      const cvr=sum.clicks?sum.conversions/sum.clicks*100:0;
      const cpa=sum.orders?sum.spend/sum.orders:0;
      const roas=sum.spend?sum.revenue/sum.spend:0;
      const costPerResult=sum.conversions?sum.spend/sum.conversions:0;
      return `
        <section class="metrics">
          <div class="metric"><div class="metric-top"><span>Chi tiêu quảng cáo</span><span class="metric-icon tone-amber">${icon('chart')}</span></div><div class="metric-value">${money(sum.spend)}</div><div class="metric-note">Tổng ngân sách đã tiêu</div></div>
          <div class="metric"><div class="metric-top"><span>Doanh thu quy gán</span><span class="metric-icon tone-emerald">${icon('arrow-up-right')}</span></div><div class="metric-value">${money(sum.revenue)}</div><div class="metric-note">Theo attribution demo</div></div>
          <div class="metric"><div class="metric-top"><span>ROAS</span><span class="metric-icon tone-violet">${icon('target')}</span></div><div class="metric-value">${roas.toFixed(2).replace('.',',')} lần</div><div class="metric-good">Mục tiêu mẫu: ≥ 4,0 lần</div></div>
          <div class="metric"><div class="metric-top"><span>Chi phí mỗi đơn hàng</span><span class="metric-icon tone-blue">${icon('shopping-bag')}</span></div><div class="metric-value">${money(Math.round(cpa))}</div><div class="metric-note">${sum.orders.toLocaleString('vi-VN')} đơn hàng quy gán</div></div>
        </section>
        <section class="metrics" style="margin-top:-2px">
          <div class="metric"><div class="metric-top"><span>Lượt hiển thị</span><span class="metric-icon tone-violet">${icon('eye')}</span></div><div class="metric-value">${sum.impressions.toLocaleString('vi-VN')}</div><div class="metric-note">Impressions</div></div>
          <div class="metric"><div class="metric-top"><span>Lượt nhấp</span><span class="metric-icon tone-rose">${icon('mouse-pointer')}</span></div><div class="metric-value">${sum.clicks.toLocaleString('vi-VN')}</div><div class="metric-note">Clicks</div></div>
          <div class="metric"><div class="metric-top"><span>CTR</span><span class="metric-icon tone-emerald">${icon('activity')}</span></div><div class="metric-value">${ctr.toFixed(2).replace('.',',')}%</div><div class="metric-note">Tỷ lệ nhấp</div></div>
          <div class="metric"><div class="metric-top"><span>CPC</span><span class="metric-icon tone-blue">${icon('wallet')}</span></div><div class="metric-value">${money(Math.round(cpc))}</div><div class="metric-note">Chi phí / lượt nhấp</div></div>
        </section>
        <section class="metrics" style="margin-top:-2px">
          <div class="metric"><div class="metric-top"><span>CPM</span><span class="metric-icon tone-amber">${icon('layers')}</span></div><div class="metric-value">${money(Math.round(cpm))}</div><div class="metric-note">Chi phí / 1.000 hiển thị</div></div>
          <div class="metric"><div class="metric-top"><span>CVR</span><span class="metric-icon tone-rose">${icon('target')}</span></div><div class="metric-value">${cvr.toFixed(2).replace('.',',')}%</div><div class="metric-note">Tỷ lệ chuyển đổi</div></div>
          <div class="metric"><div class="metric-top"><span>Chi phí mỗi kết quả</span><span class="metric-icon tone-violet">${icon('banknote')}</span></div><div class="metric-value">${money(Math.round(costPerResult))}</div><div class="metric-note">Cost per result</div></div>
          <div class="metric"><div class="metric-top"><span>Thêm vào giỏ / Thanh toán</span><span class="metric-icon tone-emerald">${icon('shopping-cart')}</span></div><div class="metric-value">${sum.atc.toLocaleString('vi-VN')} / ${sum.checkout.toLocaleString('vi-VN')}</div><div class="metric-note">ATC / Initiated checkout</div></div>
        </section>

        <section class="ad-cards">
          ${campaigns.map(c=>`<div class="ad-card"><h4>${c.name}</h4><span class="pill ${c.status==='Cần tối ưu'?'warn':'ok'}">${c.status}</span><p><strong>${String(c.roas).replace('.',',')} lần</strong> <span class="mini">ROAS</span></p><div class="mini">Chi tiêu: ${money(c.spend)}</div><div class="mini">Doanh thu: ${money(c.revenue)}</div><div class="progress"><i style="width:${Math.min(100,Math.round(c.roas/8*100))}%"></i></div></div>`).join('')}
        </section>

        <section class="panel">
          <div class="panel-head"><div><h3>Tổng quan chiến dịch quảng cáo</h3><div class="mini">Mô phỏng các chỉ số thường dùng khi xem trên TikTok Ads.</div></div><span class="pill purple">Ads demo</span></div>
          <div class="table-wrap"><table><thead><tr><th>Chiến dịch</th><th>Mục tiêu</th><th>Trạng thái</th><th>Chi tiêu</th><th>Doanh thu</th><th>ROAS</th><th>Hiển thị</th><th>Nhấp</th><th>CTR</th><th>CPC</th><th>CVR</th><th>Đơn</th></tr></thead><tbody>
            ${campaigns.map(c=>`<tr><td><b>${c.name}</b><div class="mini">Nguồn: ${c.source}</div></td><td>${c.objective}</td><td><span class="pill ${c.status==='Cần tối ưu'?'warn':'ok'}">${c.status}</span></td><td>${money(c.spend)}</td><td>${money(c.revenue)}</td><td><b>${String(c.roas).replace('.',',')} lần</b></td><td>${c.impressions.toLocaleString('vi-VN')}</td><td>${c.clicks.toLocaleString('vi-VN')}</td><td>${String(c.ctr).replace('.',',')}%</td><td>${money(c.cpc)}</td><td>${String(c.cvr).replace('.',',')}%</td><td>${c.orders}</td></tr>`).join('')}
          </tbody></table></div>
        </section>

        <section class="sum-box">
          <section class="panel">
            <div class="panel-head"><div><h3>Phễu chuyển đổi</h3><div class="mini">Giúp xem rơi nhiều ở bước nào.</div></div></div>
            <div class="pair-grid">
              <div class="pair-card"><h4>Lượt hiển thị</h4><div class="line"><span class="label">Tổng impressions</span><span class="value">${sum.impressions.toLocaleString('vi-VN')}</span></div><div class="line"><span class="label">CTR</span><span class="value">${ctr.toFixed(2).replace('.',',')}%</span></div></div>
              <div class="pair-card"><h4>Nhấp & xem sản phẩm</h4><div class="line"><span class="label">Lượt nhấp</span><span class="value">${sum.clicks.toLocaleString('vi-VN')}</span></div><div class="line"><span class="label">CPC</span><span class="value">${money(Math.round(cpc))}</span></div></div>
              <div class="pair-card"><h4>Thêm vào giỏ / thanh toán</h4><div class="line"><span class="label">Add to cart</span><span class="value">${sum.atc.toLocaleString('vi-VN')}</span></div><div class="line"><span class="label">Checkout</span><span class="value">${sum.checkout.toLocaleString('vi-VN')}</span></div></div>
              <div class="pair-card"><h4>Đơn hàng / doanh thu</h4><div class="line"><span class="label">Đơn quy gán</span><span class="value">${sum.orders.toLocaleString('vi-VN')}</span></div><div class="line"><span class="label">Doanh thu</span><span class="value">${money(sum.revenue)}</span></div></div>
            </div>
          </section>
          <section class="panel">
            <div class="panel-head"><div><h3>Đánh giá hiệu suất & gợi ý tối ưu</h3><div class="mini">Bản demo mô phỏng phần nhận xét trong tab phân tích quảng cáo</div></div><span class="pill purple">Rule-based demo</span></div>
            <div class="tip"><b>${icon('arrow-up-right','tip-icon')} GMV Max đang cho hiệu suất tốt</b>ROAS 6,8 lần vượt mục tiêu. Có thể tăng ngân sách từng bước 10–15% và theo dõi ROAS cận biên.</div>
            <div class="tip"><b>${icon('alert','tip-icon')} Video Shopping cần tối ưu creative</b>Nên test thêm 2–3 video mới, so lại hook 3 giây đầu, CTR và CVR trước khi tăng ngân sách.</div>
            <div class="tip"><b>${icon('info','tip-icon')} Theo dõi riêng CPM, CPC và CVR</b>Nếu CTR ổn nhưng CVR thấp, cần kiểm tra trang sản phẩm, giá, voucher và luồng checkout.</div>
            <div class="tip"><b>${icon('banknote','tip-icon')} Tách doanh thu Ads và GMV Shop</b>Doanh thu quy gán từ Ads không nên cộng trực tiếp vào GMV LIVE để tránh đếm trùng.</div>
          </section>
        </section>`;
    }

    function exportAdsCSV(){
      const lines=['Chien dich,Muc tieu,Trang thai,Chi tieu,Doanh thu,ROAS,Hien thi,Nhấp,CTR,CPC,CVR,Don'];
      [
        ['GMV Max • Livestream','Doanh số tối đa','Đang chạy',8400000,57120000,6.8,486000,14600,'3.00%','575đ','1.27%',168],
        ['Video Shopping • A','Chuyển đổi','Cần tối ưu',6200000,19220000,3.1,352000,7040,'2.00%','881đ','1.14%',76],
        ['Retargeting • B','Tiếp thị lại','Đang chạy',4000000,19600000,4.9,118000,4484,'3.80%','892đ','1.83%',76]
      ].forEach(r=>lines.push(r.join(',')));
      downloadCSV(lines.join('\n'),'bao_cao_tiktok_ads.csv');
    }

function hostSummaryRows(rows){
      return HOSTS.map(host=>{
        const list = rows.filter(x=>x.host===host);
        const sum = totals(list);
        const net = sum.gross - sum.refund;
        return {
          host,
          operator: PAIRS[host],
          sessions: list.length,
          hours: sum.hours,
          net,
          hostKpi: net * 0.003,
          operatorKpi: net * 0.001
        };
      });
    }

    function renderKPI(){
      const rows = filteredLives();
      const summary = hostSummaryRows(rows);
      const net = totals(rows).gross - totals(rows).refund;
      const hungBG = summary.filter(x=>x.operator==='Hùng Bắc Giang').reduce((a,x)=>a+x.net,0);
      const hungHH = summary.filter(x=>x.operator==='Hùng Hiền Hòa').reduce((a,x)=>a+x.net,0);

      return `
        <section class="metrics">
          <div class="metric"><div class="metric-top"><span>GMV sau hoàn / hủy</span><span class="metric-icon tone-violet">${icon('wallet')}</span></div><div class="metric-value">${moneyShort(net)}</div><div class="metric-note">Nền tảng để tính KPI</div></div>
          <div class="metric"><div class="metric-top"><span>Tổng KPI Host 0,3%</span><span class="metric-icon tone-rose">${icon('user')}</span></div><div class="metric-value">${money(net*0.003)}</div><div class="metric-note">Theo gắn thẻ Host hiện tại</div></div>
          <div class="metric"><div class="metric-top"><span>Tổng KPI vận hành 0,1%</span><span class="metric-icon tone-blue">${icon('settings')}</span></div><div class="metric-value">${money(net*0.001)}</div><div class="metric-note">Theo cặp host – vận hành</div></div>
          <div class="metric"><div class="metric-top"><span>Tổng giờ LIVE</span><span class="metric-icon tone-emerald">${icon('clock')}</span></div><div class="metric-value">${formatHoursDecimal(totals(rows).hours)}</div><div class="metric-note">Theo các phiên đang lọc</div></div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h3>KPI theo từng cặp Host & vận hành</h3><div class="mini">Host 0,3% • Vận hành 0,1% theo GMV sau hoàn/hủy</div></div></div>
          <div class="pair-grid">
            ${summary.map(x=>`<div class="pair-card">
              <h4>${x.host} <span class="mini">↔ ${x.operator}</span></h4>
              <div class="line"><span class="label">Số phiên LIVE</span><span class="value">${x.sessions}</span></div>
              <div class="line"><span class="label">Tổng giờ LIVE</span><span class="value">${formatHoursDecimal(x.hours)}</span></div>
              <div class="line"><span class="label">GMV sau hoàn/hủy</span><span class="value">${money(x.net)}</span></div>
              <div class="line"><span class="label">KPI ${x.host} • 0,3%</span><span class="value">${money(x.hostKpi)}</span></div>
              <div class="line"><span class="label">KPI ${x.operator} • 0,1%</span><span class="value">${money(x.operatorKpi)}</span></div>
            </div>`).join('')}
          </div>
        </section>

        <section class="sum-box">
          <div class="panel">
            <div class="panel-head"><div><h3>Tổng hợp KPI vận hành</h3><div class="mini">Phần này làm rõ trường hợp 1 nhân sự vận hành quản lý nhiều Host</div></div></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Vận hành</th><th>Host phụ trách</th><th>GMV áp dụng</th><th>KPI 0,1%</th></tr></thead>
                <tbody>
                  <tr><td><b>Hùng Bắc Giang</b></td><td>Thảo My</td><td>${money(hungBG)}</td><td><b>${money(hungBG*0.001)}</b></td></tr>
                  <tr><td><b>Hùng Hiền Hòa</b></td><td>Dung + Tâm</td><td>${money(hungHH)}</td><td><b>${money(hungHH*0.001)}</b></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head"><div><h3>Giải thích logic KPI</h3><div class="mini">Theo đúng quy tắc bạn yêu cầu</div></div></div>
            <div class="note">
              • <b>Thảo My</b> đi cùng <b>Hùng Bắc Giang</b>: KPI Thảo My = 0,3% GMV ròng của các phiên được gắn thẻ Thảo My; KPI Hùng Bắc Giang = 0,1% cùng tập phiên đó.<br><br>
              • <b>Dung</b> và <b>Tâm</b> đi cùng <b>Hùng Hiền Hòa</b>: KPI Dung / Tâm vẫn tính riêng 0,3% theo từng Host; còn KPI Hùng Hiền Hòa = 0,1% trên <b>tổng GMV ròng cộng dồn của cả Dung và Tâm</b>.
            </div>
          </div>
        </section>`;
    }
