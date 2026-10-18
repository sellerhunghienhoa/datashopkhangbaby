/* DATA SHOPKHANGBABY | Trích từ demo V40 | JS truyền thống, tải theo đúng thứ tự. */
    let selectPopover = null;
    let selectedTrigger = null;
    function closeSelectPopover(restoreFocus=false){
      if(selectPopover){selectPopover.remove();selectPopover=null;}
      if(selectedTrigger){
        selectedTrigger.setAttribute('aria-expanded','false');
        const owner=selectedTrigger.closest('.custom-select');
        if(owner) owner.classList.remove('is-open');
        if(restoreFocus && selectedTrigger.isConnected) selectedTrigger.focus({preventScroll:true});
        selectedTrigger=null;
      }
    }
    function selectChevron(){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 20 20');
      svg.setAttribute('aria-hidden','true');
      svg.classList.add('custom-select-chevron');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M5 7.5 10 12.5 15 7.5');
      path.setAttribute('fill','none');
      path.setAttribute('stroke','currentColor');
      path.setAttribute('stroke-width','1.8');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('stroke-linejoin','round');
      svg.append(path);
      return svg;
    }
    // Hiện ngày đã áp dụng trên nút lọc thay vì để nguyên nhãn “Chọn ngày”.
    // Dùng định dạng gọn trong thanh lọc và đầy đủ trong tooltip hỗ trợ xem ngày.
    function selectedRangeLabel(native, full=false){
      const current=native.selectedOptions[0]?.textContent || 'Chọn';
      if(!native.dataset.rangeSelect || native.value!=='custom')return current;
      const from=parseInputDate(state.dateStart);
      const to=parseInputDate(state.dateEnd);
      if(!from || !to)return current;
      const pad=value=>String(value).padStart(2,'0');
      const fullDate=d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
      const shortDate=d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}`;
      if(full)return `${fullDate(from)} – ${fullDate(to)}`;
      // Có năm trong nút để dễ phân biệt khi lọc dữ liệu qua nhiều tháng.
      if(from.getFullYear()===to.getFullYear()){
        return `${shortDate(from)} – ${shortDate(to)}/${to.getFullYear()}`;
      }
      return `${shortDate(from)}/${String(from.getFullYear()).slice(-2)} – ${shortDate(to)}/${String(to.getFullYear()).slice(-2)}`;
    }
    // Bộ chọn ngày mở rộng bên trong dropdown, không tách thành một khung ngoài.
    function renderDateRangePanel(popup,native,trigger){
      popup.classList.add('date-select-popover','date-range-open');
      popup.setAttribute('role','dialog');
      popup.setAttribute('aria-label','Chọn khoảng ngày tối đa 3 tháng');
      popup.querySelector('.date-range-panel')?.remove();
      const savedStart=state.dateStart;
      const savedEnd=state.dateEnd;
      let from=(native.value==='custom' && savedStart)?parseInputDate(savedStart):null;
      let to=(native.value==='custom' && savedEnd)?parseInputDate(savedEnd):null;
      const today=getDefaultMaxDate();
      const oldest=new Date(today.getFullYear(),today.getMonth()-3,today.getDate());
      let viewMonth=new Date((from||today).getFullYear(),(from||today).getMonth(),1);
      const panel=document.createElement('div');
      panel.className='date-range-panel';
      panel.innerHTML=`<div class="range-panel-head"><div class="range-title-wrap"><button type="button" class="range-back" aria-label="Quay lại danh sách khoảng thời gian">‹</button><div><b>Chọn khoảng ngày</b><small>Chọn ngày bắt đầu, sau đó chọn ngày kết thúc</small></div></div><span class="range-panel-limit">Tối đa 3 tháng</span></div><div class="range-selection-label" aria-live="polite"></div><div class="range-month-toolbar"><button type="button" class="range-month-prev" aria-label="Tháng trước">‹</button><span class="range-month-title"></span><button type="button" class="range-month-next" aria-label="Tháng sau">›</button></div><div class="range-months"></div><div class="range-panel-note" aria-live="polite"></div><div class="range-panel-actions"><button class="range-cancel" type="button">Hủy</button><button class="range-apply" type="button">Áp dụng</button></div>`;
      popup.append(panel);
      const formatDate=d=>d?`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`:'Chưa chọn';
      const getMonthLabel=d=>`Tháng ${d.getMonth()+1}/${d.getFullYear()}`;
      const dateDiff=(a,b)=>Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000)+1;
      function renderMonth(month){
        const year=month.getFullYear(),mm=month.getMonth();
        const label=getMonthLabel(month);
        const firstOffset=(new Date(year,mm,1).getDay()+6)%7;
        const count=new Date(year,mm+1,0).getDate();
        const names=['T2','T3','T4','T5','T6','T7','CN'];
        let days=names.map(day=>`<span class="range-weekday">${day}</span>`).join('');
        for(let z=0;z<firstOffset;z++)days+='<span class="range-day-blank"></span>';
        for(let d=1;d<=count;d++){
          const dt=new Date(year,mm,d);const iso=toInputDate(dt);
          const isDisabled=dt<oldest||dt>today;
          const selectedStart=from && dt.getTime()===from.getTime();
          const selectedEnd=to && dt.getTime()===to.getTime();
          const inRange=from&&to&&dt>from&&dt<to;
          const isToday=dt.getTime()===today.getTime();
          days+=`<button type="button" class="range-day ${selectedStart||selectedEnd?'is-edge':''} ${inRange?'is-within':''} ${isToday?'is-today':''}" data-day="${iso}" ${isDisabled?'disabled':''} aria-label="${formatDate(dt)}">${d}</button>`;
        }
        return `<div class="range-month"><div class="range-month-label">${label}</div><div class="range-days">${days}</div></div>`;
      }
      function place(){
        if(!trigger.isConnected)return;
        const rect=trigger.getBoundingClientRect();
        const vw=window.innerWidth,vh=window.innerHeight;
        const width=Math.min(vw-16,vw<540?390:638);
        popup.style.width=width+'px';
        popup.style.maxHeight='none';
        popup.style.overflow='visible';
        popup.style.bottom='auto';
        // Không thêm thanh cuộn vào menu: căn trong viewport bằng chính chiều cao lịch.
        const needed=popup.getBoundingClientRect().height;
        const top=Math.max(8,Math.min(rect.bottom+7,vh-needed-8));
        popup.style.top=top+'px';
        popup.style.left=Math.max(8,Math.min(rect.left,vw-width-8))+'px';
      }
      function paint(){
        const prev=new Date(viewMonth.getFullYear(),viewMonth.getMonth()-1,1);
        const months=panel.querySelector('.range-months');
        months.innerHTML=renderMonth(prev)+renderMonth(viewMonth);
        panel.querySelector('.range-month-title').textContent=getMonthLabel(prev)+' – '+getMonthLabel(viewMonth);
        panel.querySelector('.range-selection-label').textContent=`${formatDate(from)}  →  ${formatDate(to)}`;
        const note=panel.querySelector('.range-panel-note');
        note.textContent=from&&!to?'Tiếp tục chọn ngày kết thúc.':from&&to?`${dateDiff(from,to)} ngày được chọn`:'Chọn 2 ngày để tạo khoảng lọc.';
        panel.querySelector('.range-apply').disabled=!(from&&to);
        panel.querySelector('.range-month-next').disabled=viewMonth>=new Date(today.getFullYear(),today.getMonth(),1);
        panel.querySelector('.range-month-prev').disabled=prev<=new Date(oldest.getFullYear(),oldest.getMonth()-1,1);
        place();
      }
      panel.querySelector('.range-month-prev').addEventListener('click',()=>{viewMonth=new Date(viewMonth.getFullYear(),viewMonth.getMonth()-1,1);paint();});
      panel.querySelector('.range-month-next').addEventListener('click',()=>{viewMonth=new Date(viewMonth.getFullYear(),viewMonth.getMonth()+1,1);paint();});
      panel.querySelector('.range-months').addEventListener('click',event=>{
        const button=event.target.closest('button[data-day]');if(!button || button.disabled)return;
        const clicked=parseInputDate(button.dataset.day);
        if(!from||to||clicked<from){from=clicked;to=null;}
        else if(!isWithinThreeMonths(from,clicked)){
          from=clicked;to=null;
          panel.querySelector('.range-panel-note').textContent='Khoảng ngày tối đa 3 tháng, vui lòng chọn lại ngày kết thúc.';
        }else{to=clicked;}
        paint();
      });
      panel.querySelector('.range-back').addEventListener('click',()=>{
        // Giữ popup hiện tại, thu gọn lịch để trở lại các mốc thời gian.
        panel.remove();
        popup.classList.remove('date-range-open','date-select-popover');
        popup.setAttribute('role','listbox');
        popup.setAttribute('aria-label',native.getAttribute('aria-label')||'Chọn thời gian');
        popup.style.width=Math.max(trigger.getBoundingClientRect().width,190)+'px';
        popup.style.maxHeight='none';
        popup.style.overflow='visible';
        const r=trigger.getBoundingClientRect();
        const needed=popup.getBoundingClientRect().height;
        popup.style.left=Math.max(8,Math.min(r.left,window.innerWidth-popup.getBoundingClientRect().width-8))+'px';
        popup.style.top=Math.max(8,Math.min(r.bottom+7,window.innerHeight-needed-8))+'px';
      });
      panel.querySelector('.range-cancel').addEventListener('click',()=>closeSelectPopover(true));
      panel.querySelector('.range-apply').addEventListener('click',()=>{
        if(!from||!to||!isWithinThreeMonths(from,to))return;
        state.dateStart=toInputDate(from);state.dateEnd=toInputDate(to);
        closeSelectPopover();
        native.value='custom';
        native.dispatchEvent(new Event('change',{bubbles:true}));
      });
      paint();
    }

    function selectCheck(){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 20 20');svg.classList.add('select-option-check');
      svg.setAttribute('aria-hidden','true');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','m4 10 4.1 4L16 6');
      path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');
      path.setAttribute('stroke-width','2');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
      svg.append(path);return svg;
    }
    function showSelectPopover(native,trigger){
      if(native.disabled) return;
      if(selectedTrigger===trigger){closeSelectPopover(true);return;}
      closeSelectPopover();
      const popup=document.createElement('div');
      popup.className='select-popover';
      popup.setAttribute('role','listbox');
      popup.setAttribute('aria-label',native.getAttribute('aria-label') || 'Chọn một tùy chọn');
      const options=Array.from(native.options);
      options.forEach(opt=>{
        const button=document.createElement('button');
        button.type='button';button.className='select-option';button.setAttribute('role','option');
        const active=opt.selected;
        button.setAttribute('aria-selected',String(active));
        if(active)button.classList.add('is-selected');
        if(opt.disabled)button.disabled=true;
        const text=document.createElement('span');text.textContent=opt.textContent;
        button.append(text);
        if(active)button.append(selectCheck());
        button.addEventListener('click',()=>{
          if(native.dataset.rangeSelect && opt.value==='custom'){
            renderDateRangePanel(popup,native,trigger);
            return;
          }
          closeSelectPopover();
          if(native.value !== opt.value){
            native.value=opt.value;
            native.dispatchEvent(new Event('change',{bubbles:true}));
          }else if(trigger.isConnected){trigger.focus({preventScroll:true});}
        });
        popup.append(button);
      });
      document.body.append(popup);
      if(native.dataset.rangeSelect){
        popup.classList.add('date-option-popover');
      }
      const box=trigger.getBoundingClientRect();
      const viewportWidth=window.innerWidth, viewportHeight=window.innerHeight;
      const desiredWidth=Math.max(box.width,native.classList.contains('host-compact-select')?148:180);
      const width=Math.min(desiredWidth,viewportWidth-16);
      const left=Math.max(8,Math.min(box.left,viewportWidth-width-8));
      const usableBelow=viewportHeight-box.bottom-10;
      const usableAbove=box.top-10;
      const openUp=usableBelow<Math.min(220, popup.scrollHeight+12) && usableAbove>usableBelow;
      popup.style.width=width+'px';
      popup.style.left=left+'px';
      if(native.dataset.rangeSelect){
        // Đủ chỗ cho 7 lựa chọn bằng cách chuyển vị trí menu, không tạo cuộn dọc.
        popup.style.maxHeight='none';
        popup.style.overflow='visible';
        const needed=popup.getBoundingClientRect().height;
        popup.style.bottom='auto';
        popup.style.top=Math.max(8,Math.min(box.bottom+6,viewportHeight-needed-8))+'px';
      }else{
        popup.style.maxHeight=Math.max(100,Math.min(310,openUp?usableAbove-8:usableBelow-8))+'px';
        if(openUp){popup.style.top='auto';popup.style.bottom=(viewportHeight-box.top+6)+'px';}
        else popup.style.top=(box.bottom+6)+'px';
      }
      selectedTrigger=trigger;selectPopover=popup;
      trigger.closest('.custom-select').classList.add('is-open');
      trigger.setAttribute('aria-expanded','true');
      const selectedIndex=options.findIndex(opt=>opt.selected);
      if(selectedIndex>4 && !native.dataset.rangeSelect)popup.scrollTop=Math.max(0,selectedIndex*40-80);
    }
    function enhanceAllSelects(){
      document.querySelectorAll('#appShell select:not(.custom-native-select)').forEach(native=>{
        const host=native.classList.contains('host-compact-select');
        const filter=native.classList.contains('select');
        const wrapper=document.createElement('span');
        wrapper.className='custom-select '+(host?'custom-host-select':filter?'custom-filter-select':'custom-field-select');
        if(filter){
          const kind=native.getAttribute('aria-label')?.includes('thời gian')?'dateFilter'
            :(Array.from(native.options).some(o=>o.value==='all' && o.text.includes('Host'))?'hostFilter':'statusFilter');
          wrapper.dataset.kind=kind;
        }
        native.parentNode.insertBefore(wrapper,native);
        wrapper.append(native);
        native.classList.add('custom-native-select');native.tabIndex=-1;
        native.setAttribute('aria-hidden','true');
        const button=document.createElement('button');button.type='button';
        button.className='custom-select-trigger';button.disabled=native.disabled;
        button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
        button.setAttribute('aria-label',native.getAttribute('aria-label') || ('Chọn: '+(native.selectedOptions[0]?.textContent||'')));
        const txt=document.createElement('span');txt.className='custom-select-text';
        txt.textContent=selectedRangeLabel(native);
        if(native.dataset.rangeSelect && native.value==='custom'){
          wrapper.classList.add('has-custom-range');
          button.title=selectedRangeLabel(native,true);
          button.setAttribute('aria-label',`Khoảng ngày: ${selectedRangeLabel(native,true)}`);
        }
        button.append(txt,selectChevron());wrapper.append(button);
        button.addEventListener('click',()=>showSelectPopover(native,button));
        button.addEventListener('keydown',event=>{
          if(event.key==='ArrowDown'||event.key==='ArrowUp'||event.key==='Enter'||event.key===' '){
            event.preventDefault();showSelectPopover(native,button);
            if(selectPopover){
              const active=selectPopover.querySelector('.is-selected')||selectPopover.querySelector('.select-option');
              if(active)active.focus({preventScroll:true});
            }
          }else if(event.key==='Escape')closeSelectPopover(true);
        });
      });
    }
    document.addEventListener('pointerdown',event=>{
      if(selectPopover && !selectPopover.contains(event.target) && !(selectedTrigger && selectedTrigger.contains(event.target)))closeSelectPopover();
    });
    document.addEventListener('keydown',event=>{
      if(!selectPopover)return;
      if(event.key==='Escape'){event.preventDefault();closeSelectPopover(true);return;}
      const items=Array.from(selectPopover.querySelectorAll('.select-option:not(:disabled)'));
      const current=items.indexOf(document.activeElement);
      if((event.key==='ArrowDown'||event.key==='ArrowUp') && (document.activeElement?.classList.contains('select-option') || document.activeElement===selectedTrigger)){
        event.preventDefault();
        const next=event.key==='ArrowDown'?Math.min(items.length-1,current+1):Math.max(0,current<0?items.length-1:current-1);
        if(items[next])items[next].focus({preventScroll:true});
      }else if(event.key==='Home'){event.preventDefault();if(items[0])items[0].focus({preventScroll:true});}
      else if(event.key==='End'){event.preventDefault();if(items.length)items[items.length-1].focus({preventScroll:true});}
    });
    window.addEventListener('resize',()=>closeSelectPopover());
    // Cuộn trang không tự đóng dropdown: tránh mất menu khi chạm trên mobile.
    document.addEventListener('scroll',()=>{
      if(!selectPopover || !selectedTrigger || !selectedTrigger.isConnected)return;
      if(selectPopover.classList.contains('date-select-popover'))return;
      const r=selectedTrigger.getBoundingClientRect();
      const p=selectPopover;
      const w=parseFloat(p.style.width)||r.width;
      p.style.left=Math.max(8,Math.min(r.left,window.innerWidth-w-8))+'px';
      if(p.style.bottom && p.style.bottom!=='auto')p.style.bottom=(window.innerHeight-r.top+6)+'px';
      else p.style.top=(r.bottom+6)+'px';
    },true);

    function syncMobileMenuButton(){
      const btn=document.getElementById('mobileMenuToggle');
      if(!btn) return;
      const open=document.body.classList.contains('mobile-menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng');
    }

    function toggleMobileMenu(force){
      const isMobile=window.innerWidth<=820;
      if(!isMobile) return;
      const shouldOpen = typeof force === 'boolean' ? force : !document.body.classList.contains('mobile-menu-open');
      document.body.classList.toggle('mobile-menu-open', shouldOpen);
      syncMobileMenuButton();
      if(shouldOpen){document.getElementById('mobileMenuClose')?.focus({preventScroll:true});}
    }

    function closeMobileMenu(){
      if(document.body.classList.contains('mobile-menu-open')){
        const focusWasInMenu=document.getElementById('mobileSidebar')?.contains(document.activeElement);
        document.body.classList.remove('mobile-menu-open');
        syncMobileMenuButton();
        if(focusWasInMenu)document.getElementById('mobileMenuToggle')?.focus({preventScroll:true});
      }
    }

    window.addEventListener('resize',()=>{
      if(window.innerWidth>820) closeMobileMenu();
      syncMobileMenuButton();
    });

    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){closeMobileMenu();closeProfileModal();closeTeamModal();closeDeleteTeamModal();}
    });

    function syncAuthView(){
      const signedIn=Boolean(state.signedIn);
      const body=document.body;
      const login=document.getElementById('loginScreen');
      const app=document.getElementById('appShell');
      body.classList.remove('auth-pending');
      body.classList.toggle('auth-signed-in',signedIn);
      body.classList.toggle('auth-signed-out',!signedIn);
      if(login) login.classList.toggle('hidden',signedIn);
      if(app) app.classList.toggle('hidden',!signedIn);
      if(!signedIn){
        closeSelectPopover();
        closeMobileMenu();
        document.getElementById('toolbar').innerHTML='';
        document.getElementById('content').innerHTML='';
        // Safari iOS giữ scroll riêng của fixed login và scroll trang khi đóng app.
        if(login) login.scrollTop=0;
        document.documentElement.scrollTop=0;
        document.body.scrollTop=0;
        window.scrollTo(0,0);
        window.requestAnimationFrame(()=>{
          if(login) login.scrollTop=0;
          window.scrollTo(0,0);
        });
      }
      syncMobileMenuButton();
    }

    function render(){
      closeSelectPopover();
      if(!canAccessTab(state.currentTab))state.currentTab=canAccessTab('overview')?'overview':(TEAM_FEATURES.find(f=>canAccessTab(f.id))?.id||'overview');
      buildToolbar();
      document.getElementById('pageTitle').textContent = TITLE_MAP[state.currentTab];
      document.getElementById('mobilePageTitle').textContent = TITLE_MAP[state.currentTab];
      refreshProfileButton();
      document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.tab===state.currentTab));
      document.querySelectorAll('.nav-btn[data-tab]').forEach(el=>el.classList.toggle('hidden',!canAccessTab(el.dataset.tab)));
      // Ẩn cả nhãn HỆ THỐNG nếu toàn bộ tính năng bên dưới đã bị phân quyền ẩn.
      const hasSystemAccess = canAccessTab('team') || canAccessTab('connect') || canAccessTab('storage');
      document.getElementById('systemNavHeading').classList.toggle('system-section-hidden', !hasSystemAccess);

      renderCurrentTabContent();
    }

    // V64: mọi từ khóa, bộ lọc, trạng thái phân trang / sắp xếp đều là tạm thời.
    // iOS Safari có thể khôi phục nguyên DOM + biến JS từ bfcache sau khi đóng tab.
    // Không đụng tới cấu hình API, Host đã gắn, quyền hay dữ liệu người dùng.
    function resetBrowsingFilters(redraw=true){
      closeSelectPopover();
      Object.assign(state,{
        search:'',
        channelFilter:'all', hostFilter:'all', statusFilter:'all',
        dateFilter:'30', dateStart:'', dateEnd:'',
        orderSortField:'', orderSortDirection:'',
        liveSortField:'', liveSortDirection:'',
        livePage:1
      });
      applyPresetDateRange('30');
      // Chặn form restoration của Safari trước khi React-less UI được render lại.
      document.querySelectorAll('#toolbar input[type="search"]').forEach(input=>{
        input.value='';input.setAttribute('autocomplete','off');
      });
      if(redraw && state.signedIn)render();
    }
    let browsingPageWasHidden=false;
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='hidden'){browsingPageWasHidden=true;return;}
      if(browsingPageWasHidden){browsingPageWasHidden=false;resetBrowsingFilters();}
    });
    window.addEventListener('pagehide',()=>{browsingPageWasHidden=true;});
    window.addEventListener('pageshow',event=>{
      if(event.persisted || browsingPageWasHidden){
        browsingPageWasHidden=false;
        resetBrowsingFilters();
      }
    });

    // V60: chỉ cập nhật khu vực kết quả; KHÔNG dựng lại ô tìm kiếm/toolbar.
    // Giữ nguyên DOM của input để bàn phím, focus, IME và vị trí con trỏ không bị mất.
    function updateSearchResults(input, scope='main'){
      if(!input)return;
      state.search=input.value;
      state.livePage=1;
      // Khi đang nhập có dấu/IME, đợi đến khi tổ hợp ký tự kết thúc.
      if(input.isComposing)return;
      const content=document.getElementById('content');
      if(content)content.classList.remove('view-enter');
      renderCurrentTabContent();
    }

    // V66: cập nhật bảng sau sort mà không dựng lại thanh lọc hay kéo bảng về bên trái.
    // Sort chỉ thuộc phiên hiện tại, không được ghi vào localStorage.
    function renderSortedContent(){
      const y=window.scrollY;
      renderCurrentTabContent();
      window.scrollTo({top:y,left:window.scrollX,behavior:'instant'});
    }

    function renderCurrentTabContent(){
      const scrollXValues=Array.from(document.querySelectorAll('#content .live-wrapper, #content .table-wrap')).map(el=>({x:el.scrollLeft,y:el.scrollTop}));
      const pageY=window.scrollY;
      let html = '';
      if(state.currentTab==='overview') html = renderOverview();
      if(state.currentTab==='lives') html = renderLives();
      if(state.currentTab==='orders') html = renderOrders();
      if(state.currentTab==='kpi') html = renderKPI();
      if(state.currentTab==='team') html = renderTeam();
      if(state.currentTab==='connect') html = renderConnect();
      if(state.currentTab==='storage') html = renderStorage();
      const oldList = document.querySelector('#content .live-wrapper');
      const oldX = oldList ? oldList.scrollLeft : 0;
      const oldY = window.scrollY;
      document.getElementById('content').innerHTML = html;
      enhanceAllSelects();
      const newList = document.querySelector('#content .live-wrapper');
      if(newList && oldList) newList.scrollLeft = oldX;
      const newScrollAreas=Array.from(document.querySelectorAll('#content .live-wrapper, #content .table-wrap'));
      const restoreScroll=()=>{
        newScrollAreas.forEach((area,index)=>{
          const saved=scrollXValues[index]; if(!saved)return;
          area.scrollLeft=saved.x;area.scrollTop=saved.y;
        });
      };
      restoreScroll();
      if(oldList || scrollXValues.length){window.scrollTo({left:window.scrollX,top:pageY,behavior:'instant'});}
      // Một số trình duyệt cập nhật layout sau khi thay bảng: áp dụng lại sau một frame.
      if(scrollXValues.some(x=>x.x>0))requestAnimationFrame(restoreScroll);
      syncMobileMenuButton();
      if(state.currentTab==='connect' && window.SHOPKHANGBABY_CONFIG?.mode==='live') window.ShopKhangBabyLive?.refreshStatus();
    }

    // V59: Chỉ chuyển động khi đổi tác vụ, không chạy lại animation mỗi lần gõ hoặc đồng bộ.
    let viewEnterTimer = null;
    function animateViewEntrance(){
      const content=document.getElementById('content');
      const toolbar=document.getElementById('toolbar');
      if(!content || !toolbar || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      clearTimeout(viewEnterTimer);
      content.classList.remove('view-enter');
      toolbar.classList.remove('view-enter');
      // Khởi động lại hiệu ứng sau khi nội dung tab mới đã được render.
      void content.offsetWidth;
      content.classList.add('view-enter');
      toolbar.classList.add('view-enter');
      viewEnterTimer=window.setTimeout(()=>{
        content.classList.remove('view-enter');
        toolbar.classList.remove('view-enter');
        viewEnterTimer=null;
      },560);
    }

    function go(tab){
      if(!canAccessTab(tab)){
        toast('Tài khoản hiện tại không có quyền truy cập mục này');
        return;
      }
      if(state.currentTab===tab){closeMobileMenu();return;}
      // Không giữ cách sắp xếp khi rời tab, sẽ về thứ tự mặc định nếu mở lại.
      Object.assign(state,{liveSortField:'',liveSortDirection:'',orderSortField:'',orderSortDirection:'',leaderDetailSortField:'',leaderDetailSortDirection:''});
      closeMobileMenu();
      window.scrollTo(0,0);
      state.currentTab = tab;
      render();
      animateViewEntrance();
    }

    function updateHost(id, host){
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live')return toast('Chỉnh Host thực cần API cập nhật được phân quyền và ghi nhật ký. Chưa bật ở chế độ Live.','info');
      if(!hasPermission('editHosts')){toast('Tài khoản không có quyền gắn Host');return;}
      const item = state.liveData.find(x=>x.id===id);
      if(!item) return;
      item.host = host;
      saveHosts();
      render();
      toast(`Đã gắn phiên ${id} cho Host ${host}`);
    }

    function setRole(role){
      state.previewMemberId=null;
      state.role = role;
      localStorage.setItem('dskh_role', role);
      state.currentTab = 'overview';
      render();
      toast('Đã chuyển vai trò demo: ' + ({Admin:'Quản trị viên',Ops:'Vận hành sàn',Host:'Host LIVE'})[role]);
    }

    function signIn(){
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live'){
        if(!window.ShopKhangBabyAuth)return toast('Chưa khởi tạo Firebase Authentication, hãy kiểm tra cấu hình.','error');
        return window.ShopKhangBabyAuth.signIn().catch(e=>toast('Không đăng nhập được: '+e.message,'error'));
      }
      state.signedIn = true;
      state.role='Viewer';state.previewMemberId=null;
      state.profile={displayName:'Tài khoản demo',email:'viewer@example.com',photoURL:'',uid:'',emailVerified:false,provider:'demo'};
      localStorage.setItem('dskh_role','Viewer');
      localStorage.setItem('dskh_signed_in', '1');
      resetBrowsingFilters(false);
      syncAuthView();
      render();
      animateViewEntrance();
    }

    function demoAdmin69(){
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live')return;
      state.signedIn=true;state.role='Admin';state.previewMemberId=null;
      state.profile={displayName:'Quản trị Demo',email:'admin-demo@example.com',photoURL:'',uid:'',emailVerified:false,provider:'demo'};
      localStorage.setItem('dskh_role','Admin');localStorage.setItem('dskh_signed_in','1');
      syncAuthView();render();toast('Chế độ quản trị DEMO, không cấp quyền thực tế.');
    }

    function signOut(){
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live'){
        if(!window.ShopKhangBabyAuth)return toast('Chưa có Firebase Authentication','error');
        return window.ShopKhangBabyAuth.signOut().catch(e=>toast('Không đăng xuất được: '+e.message,'error'));
      }
      closeProfileModal(true);closeTeamModal();closeDeleteTeamModal();
      state.previewMemberId=null;
      state.signedIn = false;
      localStorage.setItem('dskh_signed_in', '0');
      resetBrowsingFilters(false);
      syncAuthView();
      toast('Đã đăng xuất khỏi bản demo');
    }

    function refreshDemo(){
      if(state.currentTab !== 'connect' || !canAccessTab('connect')) return;
      const time = new Date();
      state.lastManualSync = time.toLocaleString('vi-VN');
      state.lastDemoSync = state.lastManualSync;
      state.syncHistory.unshift('Đồng bộ thủ công lúc '+state.lastManualSync+' (chỉ mô phỏng, không gọi TikTok API)');
      state.syncHistory = state.syncHistory.slice(0,10);
      render();
      toast('Đã cập nhật thời gian đồng bộ mô phỏng. Chưa kết nối TikTok API thật.', 'success', 'Đồng bộ thủ công hoàn tất');
    }


    function addDemoLive(){
      if(window.SHOPKHANGBABY_CONFIG?.mode==='live')return toast('Không thể thêm phiên demo vào dữ liệu thật.','info');
      if(!hasPermission('editHosts'))return toast('Tài khoản không có quyền thêm phiên');
      const d = Date.now().toString().slice(-16);
      state.liveData.unshift({
        id:d,
        title:'Live Daily',
        start:'18:30 17/10/2026',
        duration:'2h15min',
        hours:2.25,
        gross:18200000,
        refund:630000,
        orders:38,
        canceled:2,
        status:'Đang theo dõi',
        host:'Thảo My',
        channel:OFFICIAL_CHANNELS[0]
      });
      saveHosts();
      render();
      toast('Đã thêm 1 phiên LIVE demo mới');
    }

    function exportCSV(){
      const rows = filteredLives();
      const headers = ['ID phiên','Tên LIVE','Kênh','Host','Vận hành','Thời gian bắt đầu','Thời gian kết thúc','Thời lượng','GMV đã ghi nhận','Hoàn/hủy','GMV sau hoàn hủy','Số món bán ra','Số món hủy','Số món sau hoàn hủy','Tỷ lệ hủy','Trạng thái'];
      const body = rows.map(x=>{
        const rate = x.orders ? (x.canceled/x.orders) : 0;
        return [x.id,x.title,x.channel,x.host,PAIRS[x.host],x.start,endTimeOf(x),fullDuration(x.duration),x.gross,x.refund,x.gross-x.refund,x.orders,x.canceled,ordersAfterCancel(x),rate.toFixed(4),x.status];
      });
      const csv = '\ufeff' + [headers,...body].map(line=>line.join(',')).join('\r\n');
      const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'DATA_SHOPKHANGBABY_LIVE_2_KENH_demo.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    }

    loadState();
    resetBrowsingFilters(false);
    installDemoAutoSync();
    installStorageDemoTimer();
    syncAuthView();
    if(state.signedIn){
      render();
    }
