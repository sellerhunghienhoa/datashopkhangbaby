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
      const timeLabel = endTime ? `${beginTime}–${endTime}` : beginTime;
      const dateLabel = startDate === endDate ? startDate : `${startDate} → ${endDate}`;
      return `<div class="live-time"><strong>${timeLabel}</strong><span>${dateLabel}</span></div>`;
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

    function loadState(){
      const liveMode=window.SHOPKHANGBABY_CONFIG?.mode==='live';
      const hostSaved = localStorage.getItem('dskh_live_host_map');
      let mapped = {};
      if(hostSaved){ try{ mapped = JSON.parse(hostSaved); }catch(e){} }
      state.liveData = liveMode ? [] : baseLives.map(x=>({...x, host:mapped[x.id] || x.host}));
      state.autoEnabled = localStorage.getItem('dskh_auto_enabled') !== 'false';
      state.autoMinutes = Number(localStorage.getItem('dskh_auto_minutes') || 15);
      const role = localStorage.getItem('dskh_role');
      const signed = localStorage.getItem('dskh_signed_in');
      if(role) state.role = role;
      if(signed!==null && !liveMode) state.signedIn = signed === '1';
      if(liveMode)state.signedIn=false;
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
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live')return;
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
            ${state.currentTab==='lives'?'':`<input type="search" autocomplete="off" spellcheck="false" placeholder="Tìm tên LIVE / ID phiên / kênh..." value="${configSafe(state.search)}" oninput="updateSearchResults(this,'main')" oncompositionend="updateSearchResults(this,'main')">`}
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
            ${hasPermission('editHosts') && window.SHOPKHANGBABY_CONFIG?.mode!=='live' ? `<button class="btn primary" onclick="addDemoLive()">${icon('plus')} Thêm phiên demo</button>` : ''}
          </div>`;
      } else {
        toolbar.innerHTML = '';
      }
    }

    // V65: Biểu đồ cột 7 ngày gần nhất, cố định từ hôm nay lùi 6 ngày.
    // Dùng phiên LIVE chính thức đã nhận diện, không có dữ liệu thì hiển thị 0.
    // Bộ lọc ngày của trang không làm thay đổi 7 cột; kênh, Host, trạng thái và tìm kiếm vẫn áp dụng.
    let gmvTrendPoints=[];
    function gmvChartSafe(input){return String(input??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
    function gmvSevenDayRecords(){
      const end=getDefaultMaxDate();
      const days=Array.from({length:7},(_,index)=>{
        const d=new Date(end.getFullYear(),end.getMonth(),end.getDate()-6+index);
        return {date:toInputDate(d),label:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
          gross:0,refund:0,orders:0,sessions:0};
      });
      const byDate=new Map(days.map(d=>[d.date,d]));
      state.liveData.forEach(x=>{
        if(!OFFICIAL_CHANNELS.some(ch=>ch.toLocaleLowerCase('vi-VN')===String(x.channel||'').toLocaleLowerCase('vi-VN')))return;
        if(state.channelFilter!=='all' && String(x.channel||'').toLocaleLowerCase('vi-VN')!==String(state.channelFilter).toLocaleLowerCase('vi-VN'))return;
        if(state.hostFilter!=='all' && x.host!==state.hostFilter)return;
        if(state.statusFilter!=='all' && x.status!==state.statusFilter)return;
        const q=String(state.search||'').trim().toLocaleLowerCase('vi-VN');
        if(q && ![x.title,x.id,x.channel].some(value=>String(value||'').toLocaleLowerCase('vi-VN').includes(q)))return;
        const date=parseDMYHM(String(x.start||''));
        if(!date)return;
        const row=byDate.get(toInputDate(date));
        if(!row)return;
        row.gross+=Math.max(0,Number(x.gross)||0);
        row.refund+=Math.max(0,Number(x.refund)||0);
        row.orders+=Math.max(0,Number(x.orders)||0);
        row.sessions++;
      });
      return days.map(day=>({...day,net:Math.max(0,day.gross-day.refund)}));
    }
    function showGmvTrendPoint(index){
      const wrapper=document.querySelector('.gmv-week');
      const point=gmvTrendPoints[index];
      if(!wrapper||!point)return;
      wrapper.querySelectorAll('.gmv-week-day').forEach((button,i)=>{
        const isActive=i===index;
        button.classList.toggle('is-active',isActive);
        button.setAttribute('aria-pressed',String(isActive));
      });
      const tip=wrapper.querySelector('.gmv-week-detail');
      if(!tip)return;
      tip.innerHTML=`<div class="gmv-week-detail-head"><strong>Ngày ${gmvChartSafe(point.label)}/${point.date.slice(0,4)}</strong><span>${point.sessions} phiên LIVE · ${point.orders.toLocaleString('vi-VN')} món bán ra</span></div>
        <div class="gmv-week-detail-values"><div><span>GMV đã ghi nhận</span><b class="is-purple">${money(point.gross)}</b></div>
        <div><span>GMV sau hoàn/hủy</span><b class="is-green">${money(point.net)}</b></div>
        <div><span>Hoàn/hủy</span><b>${money(point.refund)}</b></div></div>`;
      wrapper.dataset.activePoint=String(index);
    }
    function renderGmvTrendChart(){
      const days=gmvSevenDayRecords();
      gmvTrendPoints=days;
      const count=days.reduce((n,d)=>n+d.sessions,0);
      if(!count)return `<div class="gmv-trend-empty">${icon('bar-chart')}<b>Chưa có phiên LIVE trong 7 ngày gần nhất</b><span>Biểu đồ chỉ hiển thị dữ liệu từ hôm nay lùi 6 ngày. Khi có dữ liệu, mỗi ngày sẽ tự được tổng hợp thành cột.</span></div>`;
      const maxValue=Math.max(1,...days.map(x=>x.gross));
      const fmt=date=>date.split('-').reverse().join('/');
      const bars=days.map((day,i)=>{
        const grossHeight=Math.max(0,100*day.gross/maxValue),netHeight=Math.max(0,100*day.net/maxValue);
        const readable=`Ngày ${fmt(day.date)}, ${day.sessions} phiên LIVE, GMV đã ghi nhận ${money(day.gross)}, GMV sau hoàn/hủy ${money(day.net)}`;
        return `<button type="button" class="gmv-week-day" data-gmv-index="${i}" aria-pressed="false" aria-label="${gmvChartSafe(readable)}" onclick="showGmvTrendPoint(${i})" onfocus="showGmvTrendPoint(${i})">
          <span class="gmv-week-bararea" aria-hidden="true"><span class="gmv-week-bar is-purple" style="height:${grossHeight.toFixed(2)}%"></span><span class="gmv-week-bar is-green" style="height:${netHeight.toFixed(2)}%"></span></span>
          <span class="gmv-week-day-label">${day.label}</span></button>`;
      }).join('');
      const selected=days.findLastIndex(d=>d.sessions>0);
      const html=`<div class="gmv-week" data-active-point="${selected}">
        <div class="gmv-week-top"><span>${fmt(days[0].date)} – ${fmt(days[6].date)}</span><b>${count} phiên LIVE</b></div>
        <div class="gmv-week-plot" role="group" aria-label="GMV bảy ngày gần nhất">${bars}</div>
        <div class="gmv-week-legend"><span><i class="is-purple"></i>GMV đã ghi nhận</span><span><i class="is-green"></i>GMV sau hoàn/hủy</span></div>
        <div class="gmv-week-detail" aria-live="polite"></div>
        <p class="gmv-week-note">7 ngày gần nhất (bao gồm hôm nay) · Tổng hợp theo ngày bắt đầu phiên LIVE · Đơn vị: đồng</p>
      </div>`;
      requestAnimationFrame(()=>{
        const panel=document.querySelector('.gmv-week');
        if(panel && panel.dataset.activePoint===String(selected))showGmvTrendPoint(selected);
      });
      return html;
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
                <div class="mini">Hai cột mỗi ngày: ghi nhận và sau hoàn/hủy · 7 ngày gần nhất</div>
              </div>
              <span class="pill purple">7 ngày</span>
            </div>
            ${renderGmvTrendChart()}
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
            • Chỉ tính LIVE của <b>Mẹ Khang Sữa</b> và <b>ShopKhangBaby</b> trong Tổng quan và KPI Host. LIVE của đối tác Affiliate hiển thị ở tab riêng.<br>
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
      renderSortedContent();
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
                <div class="mini live-table-caption">Chỉ hai kênh Mẹ Khang Sữa và ShopKhangBaby • Gắn Host cho từng phiên • Không gồm Affiliate</div>
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

    function cycleReportGmvSort(report, field){
      const prefix=report==='orders'?'order':'leaderDetail';
      const key=prefix+'SortField', dir=prefix+'SortDirection';
      if(state[key]!==field){state[key]=field;state[dir]='desc';}
      else if(state[dir]==='desc')state[dir]='asc';
      else{state[key]='';state[dir]='';}
      renderSortedContent();
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

        <section class="panel kpi-pair-section">
          <div class="panel-head"><div><h3>KPI theo từng cặp Host & vận hành</h3><div class="mini">Host 0,3% • Vận hành 0,1% theo GMV sau hoàn/hủy</div></div></div>
          <div class="pair-grid kpi-pair-grid">
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

        <section class="sum-box kpi-detail-section">
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
