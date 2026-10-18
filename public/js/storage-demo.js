/* DATA SHOPKHANGBABY | Trích từ demo V40 | JS truyền thống, tải theo đúng thứ tự. */
    // Dung lượng bên dưới hoàn toàn GIẢ LẬP, không phải quota hoặc số sử dụng thật.
    // Backend thật cần lấy đo đạc từng sản phẩm riêng qua API/monitoring phù hợp.
    const STORAGE_META = Object.freeze([
      {id:'firestore',label:'Firebase Firestore',desc:'Tài liệu, nhật ký thao tác và dữ liệu đồng bộ'},
      {id:'d1',label:'Cloudflare D1',desc:'Cơ sở dữ liệu cho phiên LIVE và đối soát'},
      {id:'r2',label:'Cloudflare R2',desc:'Tệp tạm, báo cáo và bản xuất dữ liệu'}
    ]);
    const STORAGE_DEFAULT_CONFIG = Object.freeze({enabled:true,threshold:85,target:70,scanMinutes:360,logs:true,cache:true,snapshots:true,logsDays:7,cacheDays:3,snapshotsDays:3});
    const STORAGE_SAMPLE_DEFAULTS = Object.freeze({
      firestore:{capacity:1000,used:790},
      d1:{capacity:600,used:535},
      r2:{capacity:1200,used:720}
    });
    function storageClampNumber(v, min, max, fallback){
      const n=Number(v);
      return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
    }
    function loadStorageDemoState(){
      let savedConfig={},savedSample={};
      try{savedConfig=JSON.parse(localStorage.getItem('dskh_storage_config_v18')||'{}')||{}}catch(e){}
      try{savedSample=JSON.parse(localStorage.getItem('dskh_storage_sample_v18')||'{}')||{}}catch(e){}
      const cfg={...STORAGE_DEFAULT_CONFIG,...savedConfig};
      cfg.enabled=cfg.enabled!==false;
      cfg.threshold=storageClampNumber(cfg.threshold,70,95,85);
      cfg.target=storageClampNumber(cfg.target,40,85,70);
      if(cfg.target>=cfg.threshold)cfg.target=Math.max(40,cfg.threshold-15);
      cfg.scanMinutes=storageClampNumber(cfg.scanMinutes,60,1440,360);
      ['logs','cache','snapshots'].forEach(k=>cfg[k]=cfg[k]!==false);
      ['logsDays','cacheDays','snapshotsDays'].forEach(k=>cfg[k]=storageClampNumber(cfg[k],1,90,7));
      state.storageConfig=cfg;
      const source={};
      for(const meta of STORAGE_META){
        const raw=savedSample.sources?.[meta.id]||STORAGE_SAMPLE_DEFAULTS[meta.id];
        const capacity=storageClampNumber(raw.capacity,1,100000000,STORAGE_SAMPLE_DEFAULTS[meta.id].capacity);
        source[meta.id]={capacity,used:storageClampNumber(raw.used,0,capacity,STORAGE_SAMPLE_DEFAULTS[meta.id].used)};
      }
      state.storageSample={sources:source,history:Array.isArray(savedSample.history)?savedSample.history.filter(x=>typeof x==='string').slice(0,15):[],lastScan:typeof savedSample.lastScan==='string'?savedSample.lastScan:'',lastClean:typeof savedSample.lastClean==='string'?savedSample.lastClean:''};
    }
    function saveStorageDemo(){
      try{
        localStorage.setItem('dskh_storage_config_v18',JSON.stringify(state.storageConfig));
        localStorage.setItem('dskh_storage_sample_v18',JSON.stringify(state.storageSample));
      }catch(e){toast('Không thể lưu cấu hình trên trình duyệt này');}
    }
    function storagePercent(row){return row.capacity>0?Math.round(row.used/row.capacity*100):0;}
    function storageNumber(n){return Math.round(n).toLocaleString('vi-VN')+' MB';}
    function storageEligibleRatio(cfg){return (cfg.cache?0.10:0)+(cfg.logs?0.07:0)+(cfg.snapshots?0.05:0);}
    function storageLevel(percent){const t=state.storageConfig.threshold;return percent>=Math.max(95,t+7)?'critical':percent>=t?'warning':'';}
    function storageStatus(percent){return percent>=state.storageConfig.threshold?'Đã đến ngưỡng dọn':percent>=state.storageConfig.threshold-10?'Sắp đến ngưỡng':'Ổn định';}
    function storageOption(cur,val){return String(cur)===String(val)?'selected':'';}
    // V19: Màn hình bộ nhớ đơn giản. Các cấu hình nâng cao vẫn giữ nguyên logic V18.
    function renderStorage(){
      const cfg=state.storageConfig, sample=state.storageSample;
      const over=STORAGE_META.filter(x=>storagePercent(sample.sources[x.id])>=cfg.threshold);
      const last=sample.lastClean ? `Dọn gần nhất: ${escapeTeam(sample.lastClean)}` : 'Chưa thực hiện dọn thử';
      return `
        <section class="panel storage-simple-panel">
          <div class="storage-simple-top">
            <div><h3>${icon('database','heading-icon')} Dung lượng bộ nhớ</h3><p class="mini">Ba nguồn dữ liệu đang theo dõi</p></div>
            <span class="pill purple">Số liệu mẫu</span>
          </div>
          <div class="storage-sources storage-simple-sources">
            ${STORAGE_META.map(meta=>{
              const row=sample.sources[meta.id], percent=storagePercent(row), level=storageLevel(percent);
              return `<div class="storage-source">
                <div class="storage-source-head"><h4>${escapeTeam(meta.label)}</h4><span class="pill ${level==='critical'?'bad':level==='warning'?'warn':'ok'}">${percent}%</span></div>
                <div class="storage-amount">${storageNumber(row.used)} <span>/ ${storageNumber(row.capacity)}</span></div>
                <div class="storage-progress ${level}" role="progressbar" aria-label="Dung lượng ${escapeTeam(meta.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${Math.min(percent,100)}%"></span></div>
              </div>`;
            }).join('')}
          </div>
          <div class="storage-simple-status"><span class="pill ${over.length?'warn':'ok'}">${over.length?`${over.length} nguồn đã chạm ngưỡng ${cfg.threshold}%`:'Dung lượng đang trong ngưỡng an toàn'}</span><span class="mini">${last}</span></div>
        </section>

        <section class="panel storage-simple-panel storage-simple-controls">
          <div class="storage-simple-top">
            <div><h3>${icon('settings','heading-icon')} Tự động dọn dẹp</h3><p class="mini">Chỉ dọn cache, nhật ký kỹ thuật cũ và bản đồng bộ tạm</p></div>
            <span class="pill ${cfg.enabled?'ok':'warn'}">${cfg.enabled?'Đã bật (demo)':'Đang tắt'}</span>
          </div>
          <form id="storageSettingsForm" onsubmit="saveStorageSettings(event)">
            <div class="storage-simple-main-settings">
              <label class="storage-switch-field" for="storageEnabled"><span><b>Bật tự động dọn</b><small>Kiểm tra định kỳ khi trang demo đang mở</small></span>
                <input id="storageEnabled" type="checkbox" ${cfg.enabled?'checked':''} aria-label="Bật tự động dọn dữ liệu mẫu"><span class="storage-switch-ui" aria-hidden="true"></span>
              </label>
              <label class="storage-field storage-simple-threshold">Bắt đầu dọn khi sử dụng
                <select id="storageThreshold">${[70,75,80,85,90,95].map(v=>`<option value="${v}" ${storageOption(cfg.threshold,v)}>${v}% dung lượng</option>`).join('')}</select>
              </label>
            </div>
            <div class="storage-simple-actions">
              <button class="btn primary" type="submit">${icon('save')} Lưu cài đặt</button>
              <button class="btn ghost" type="button" onclick="cleanStorageDemo(false)">${icon('refresh')} Dọn thử ngay</button>
            </div>
            <div class="storage-simple-explain">${icon('shield','heading-icon')} Không xóa đơn hàng, hoàn trả, đối soát, doanh thu hay KPI.</div>

            <details class="storage-advanced">
              <summary>${icon('settings','heading-icon')} Tùy chọn nâng cao <span class="storage-advanced-hint">Chu kỳ, dữ liệu cần dọn, lịch sử</span></summary>
              <div class="storage-form storage-advanced-fields">
                <label class="storage-field">Mục tiêu sau dọn<select id="storageTarget">${[40,50,60,65,70,75,80,85].map(v=>`<option value="${v}" ${storageOption(cfg.target,v)}>${v}% dung lượng</option>`).join('')}</select></label>
                <label class="storage-field">Chu kỳ kiểm tra<select id="storageScanMinutes">${[60,180,360,720,1440].map(v=>`<option value="${v}" ${storageOption(cfg.scanMinutes,v)}>${v===60?'Mỗi giờ':v<1440?'Mỗi '+(v/60)+' giờ':'Mỗi ngày'}</option>`).join('')}</select></label>
                <label class="storage-field">Giữ nhật ký kỹ thuật<select id="storageLogsDays">${[3,7,14,30].map(v=>`<option value="${v}" ${storageOption(cfg.logsDays,v)}>${v} ngày</option>`).join('')}</select></label>
                <label class="storage-field">Giữ bộ nhớ đệm<select id="storageCacheDays">${[1,3,7,14].map(v=>`<option value="${v}" ${storageOption(cfg.cacheDays,v)}>${v} ngày</option>`).join('')}</select></label>
                <label class="storage-field">Giữ bản đồng bộ tạm<select id="storageSnapshotsDays">${[1,3,7,14].map(v=>`<option value="${v}" ${storageOption(cfg.snapshotsDays,v)}>${v} ngày</option>`).join('')}</select></label>
              </div>
              <div class="storage-options storage-advanced-options">
                <label class="storage-option"><input id="storageCache" type="checkbox" ${cfg.cache?'checked':''}><span><b>Cache hết hạn</b>Chỉ dọn dữ liệu có thể tạo lại</span></label>
                <label class="storage-option"><input id="storageLogs" type="checkbox" ${cfg.logs?'checked':''}><span><b>Nhật ký kỹ thuật cũ</b>Không gồm nhật ký đối soát</span></label>
                <label class="storage-option"><input id="storageSnapshots" type="checkbox" ${cfg.snapshots?'checked':''}><span><b>Bản đồng bộ tạm</b>Chỉ dọn khi đã lưu bản chính</span></label>
              </div>
              <div class="storage-advanced-tools">
                <div class="storage-advanced-tools-title"><b>Thử với dữ liệu mẫu</b><span class="mini">Chỉnh số liệu để thử cảnh báo gần đầy</span></div>
                <div class="storage-demo-grid">${STORAGE_META.map(meta=>{const row=sample.sources[meta.id];return `<label>${escapeTeam(meta.label)}<span class="mini">Đã dùng (MB)</span><input id="storageDemoUsed_${meta.id}" type="number" min="0" max="100000000" step="1" value="${Math.round(row.used)}"><span class="mini">Giới hạn mẫu (MB)</span><input id="storageDemoCap_${meta.id}" type="number" min="1" max="100000000" step="1" value="${Math.round(row.capacity)}"></label>`;}).join('')}</div>
                <div class="storage-actions"><button class="btn ghost" type="button" onclick="saveStorageSample()">Lưu số liệu mẫu</button><button class="btn ghost" type="button" onclick="simulateHighStorage()">Thử mức 93%</button><button class="btn ghost" type="button" onclick="scanStorageDemo(false)">Quét thử</button></div>
              </div>
              <div class="storage-advanced-tools">
                <div class="storage-advanced-tools-title"><b>Lịch sử dọn thử</b><span class="mini">${sample.history.length} hoạt động gần nhất</span></div>
                <ul class="storage-log">${sample.history.length?sample.history.slice(0,8).map(h=>`<li>${escapeTeam(h)}</li>`).join(''):'<li>Chưa có hoạt động nào.</li>'}</ul>
              </div>
            </details>
          </form>
        </section>
        <div class="storage-simple-disclaimer">${icon('info','heading-icon')} Đây là <b>bản demo</b>. Dung lượng và thao tác dọn đang được mô phỏng; không kết nối và không xóa dữ liệu Firebase hoặc Cloudflare thật. Gói miễn phí còn có giới hạn đọc/ghi và yêu cầu ngoài dung lượng lưu trữ.</div>`;
    }
    function storageLog(msg){
      const time=new Date().toLocaleString('vi-VN');
      state.storageSample.history.unshift(`${time} • ${msg}`);
      state.storageSample.history=state.storageSample.history.slice(0,15);
    }
    function saveStorageSettings(e){
      e.preventDefault();
      if(!hasPermission('manageStorage'))return toast('Không có quyền quản lý bộ nhớ');
      const cfg={
        enabled:document.getElementById('storageEnabled').checked,
        threshold:Number(document.getElementById('storageThreshold').value),
        target:Number(document.getElementById('storageTarget').value),
        scanMinutes:Number(document.getElementById('storageScanMinutes').value),
        logsDays:Number(document.getElementById('storageLogsDays').value),
        cacheDays:Number(document.getElementById('storageCacheDays').value),
        snapshotsDays:Number(document.getElementById('storageSnapshotsDays').value),
        logs:document.getElementById('storageLogs').checked,
        cache:document.getElementById('storageCache').checked,
        snapshots:document.getElementById('storageSnapshots').checked
      };
      if(cfg.target>=cfg.threshold)return toast('Mục tiêu sau dọn phải thấp hơn ngưỡng bắt đầu dọn');
      if(!cfg.logs&&!cfg.cache&&!cfg.snapshots)return toast('Chọn ít nhất một loại dữ liệu tạm được phép dọn');
      state.storageConfig=cfg;
      storageLog(`Đã lưu quy tắc: dọn khi ≥${cfg.threshold}%, mục tiêu ${cfg.target}%, chu kỳ ${cfg.scanMinutes} phút (mô phỏng)`);
      saveStorageDemo();installStorageDemoTimer();render();toast('Đã lưu cấu hình mô phỏng');
    }
    function saveStorageSample(){
      if(!hasPermission('manageStorage'))return toast('Không có quyền quản lý bộ nhớ');
      const result={};
      for(const meta of STORAGE_META){
        const cap=Number(document.getElementById('storageDemoCap_'+meta.id)?.value);
        const used=Number(document.getElementById('storageDemoUsed_'+meta.id)?.value);
        if(!Number.isFinite(cap)||cap<1||!Number.isFinite(used)||used<0||used>cap)return toast('Dữ liệu mẫu không hợp lệ: đã dùng phải nằm trong giới hạn');
        result[meta.id]={capacity:Math.round(cap),used:Math.round(used)};
      }
      state.storageSample.sources=result;
      storageLog('Đã cập nhật số liệu dung lượng minh họa');
      saveStorageDemo();render();toast('Đã lưu dung lượng mẫu, không có kết nối thật');
    }
    function simulateHighStorage(){
      if(!hasPermission('manageStorage'))return;
      for(const meta of STORAGE_META){const row=state.storageSample.sources[meta.id];row.used=Math.round(row.capacity*.93);}
      storageLog('Đã thử giả lập mức sử dụng 93% cho 3 nguồn');saveStorageDemo();render();toast('Đã mô phỏng dung lượng gần đầy');
    }
    function scanStorageDemo(fromAuto){
      if(!fromAuto&&!hasPermission('manageStorage'))return;
      const cfg=state.storageConfig;
      const alerts=STORAGE_META.filter(meta=>storagePercent(state.storageSample.sources[meta.id])>=cfg.threshold);
      state.storageSample.lastScan=new Date().toLocaleString('vi-VN');
      storageLog(alerts.length?`Quét demo: ${alerts.map(x=>x.label).join(', ')} đã đến ngưỡng ${cfg.threshold}%`:'Quét demo: chưa nguồn nào vượt ngưỡng dọn');
      saveStorageDemo();
      if(state.currentTab==='storage')render();
      if(!fromAuto)toast(alerts.length?`Có ${alerts.length} nguồn đã đến ngưỡng`:'Dung lượng mẫu đang dưới ngưỡng');
      return alerts;
    }
    function cleanStorageDemo(fromAuto){
      if(!fromAuto&&!hasPermission('manageStorage'))return;
      const cfg=state.storageConfig,sample=state.storageSample;
      const alerts=STORAGE_META.filter(meta=>storagePercent(sample.sources[meta.id])>=cfg.threshold);
      sample.lastScan=new Date().toLocaleString('vi-VN');
      if(!alerts.length){storageLog('Không dọn: các nguồn đều dưới ngưỡng');saveStorageDemo();if(state.currentTab==='storage')render();if(!fromAuto)toast('Chưa đến ngưỡng dọn');return;}
      const ratio=storageEligibleRatio(cfg);
      let removed=0;
      for(const meta of alerts){
        const row=sample.sources[meta.id];
        const wanted=Math.max(0,row.used-row.capacity*cfg.target/100);
        const eligible=Math.floor(row.used*ratio);
        const take=Math.max(0,Math.min(wanted,eligible));
        row.used=Math.max(0,row.used-take);removed+=take;
      }
      sample.lastClean=new Date().toLocaleString('vi-VN');
      storageLog(`Dọn ${fromAuto?'tự động':'thủ công'} giả lập: giảm ${storageNumber(removed)} ở ${alerts.length} nguồn; chỉ gồm cache, log kỹ thuật và bản đồng bộ tạm`);
      saveStorageDemo();if(state.currentTab==='storage')render();
      if(!fromAuto)toast(`Đã giảm ${storageNumber(removed)} số liệu mô phỏng — không xóa dữ liệu thật`);
    }
    let storageDemoTimer=null;
    function installStorageDemoTimer(){
      if(storageDemoTimer)clearInterval(storageDemoTimer);
      if(state.storageConfig?.enabled){
        storageDemoTimer=setInterval(()=>{
          const due=STORAGE_META.some(x=>storagePercent(state.storageSample.sources[x.id])>=state.storageConfig.threshold);
          if(due)cleanStorageDemo(true);
          else scanStorageDemo(true);
        },Math.max(60,state.storageConfig.scanMinutes)*60000);
      }
    }
