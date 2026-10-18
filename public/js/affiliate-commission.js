/* DATA SHOPKHANGBABY V47 – local demo only. No real TikTok financial records. */
(function(scope){
  'use strict';
  const STORE_RATES='dskh_aff_sku_rate_versions_v47';
  const STORE_OVERRIDES='dskh_aff_line_adjustments_v47';
  const STORE_AUDIT='dskh_aff_audit_v47';
  const SKU_CATALOG=Object.freeze([
    {id:'SKU-SUA-01',name:'Sữa mẫu A',initialBps:1000},
    {id:'SKU-SUA-02',name:'Sữa mẫu B',initialBps:1500},
    {id:'SKU-BINH-01',name:'Bình sữa mẫu',initialBps:500},
    {id:'SKU-BIM-01',name:'Bỉm mẫu',initialBps:800},
    {id:'SKU-DO-01',name:'Đồ dùng mẹ và bé mẫu',initialBps:1200}
  ]);
  const INITIAL_RATES=SKU_CATALOG.map(x=>({id:x.id+'-BASE',skuId:x.id,bps:x.initialBps,effectiveFrom:'2026-10-01',source:'Thiết lập minh họa ban đầu'})).concat([
    {id:'SKU-SUA-01-V2',skuId:'SKU-SUA-01',bps:1100,effectiveFrom:'2026-10-16',source:'Ví dụ thay đổi từ 16/10'}
  ]);
  function nnd(value){const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:null;}
  function assertCurrency(n,label){if(nnd(n)===null)throw new Error(label+' phải là số nguyên đồng Việt Nam không âm.');return Number(n);}
  function calc(paid,refund,bps,status){
    paid=assertCurrency(paid,'Doanh thu thực trả');refund=assertCurrency(refund,'Hoàn tiền');
    if(refund>paid)throw new Error('Hoàn tiền không được vượt giá trị thực trả');
    if(!Number.isInteger(bps)||bps<0||bps>10000)throw new Error('Tỷ lệ hoa hồng không hợp lệ');
    const paidEligible=Math.max(0,paid-refund);
    const canceled=status==='cancelled'||status==='fully_refunded';
    return {estimated:Math.round(paid*bps/10000),adjusted:canceled?0:Math.round(paidEligible*bps/10000),eligible:canceled?0:paidEligible};
  }
  function atDate(s){return String(s||'').slice(0,10);}
  function lookupRate(rates,skuId,orderedAt){
    const versions=rates.filter(x=>x.skuId===skuId&&x.effectiveFrom<=atDate(orderedAt)).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom)||String(b.id).localeCompare(String(a.id)));
    return versions[0]||null;
  }
  function validRates(value){return Array.isArray(value)&&value.every(x=>SKU_CATALOG.some(s=>s.id===x.skuId)&&Number.isInteger(x.bps)&&x.bps>=0&&x.bps<=10000&&/^\d{4}-\d{2}-\d{2}$/.test(x.effectiveFrom));}
  function create(sessionList,storage){
    const memory={};
    const db=storage||{getItem(k){return memory[k]||null},setItem(k,v){memory[k]=v},removeItem(k){delete memory[k]}};
    function read(key,fallback){try{return JSON.parse(db.getItem(key))||fallback}catch{return fallback}}
    const storedRates=read(STORE_RATES,[]);
    const rates=INITIAL_RATES.concat(validRates(storedRates)?storedRates:[]);
    let audit=read(STORE_AUDIT,[]);
    if(!Array.isArray(audit))audit=[];
    function log(action,reference,oldValue,newValue){
      audit.unshift({at:new Date().toISOString(),action,reference,oldValue,newValue,actor:'Admin demo'});
      audit=audit.slice(0,100);db.setItem(STORE_AUDIT,JSON.stringify(audit));
    }
    let overrides=read(STORE_OVERRIDES,{});
    if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))overrides={};
    const base=[];
    sessionList.forEach((session,sIdx)=>{
      const count=Math.max(1,Number(session.orders)||1);
      const gross=Math.max(0,Number(session.gross)||0);
      const refund=Math.max(0,Number(session.refund)||0);
      const minEach=Math.floor(gross/count);
      const paidRemainder=gross%count;
      let refundRemaining=refund;
      for(let i=0;i<count;i++){
        const paidVnd=minEach+(i<paidRemainder?1:0);
        const refundVnd=Math.min(refundRemaining,paidVnd);
        refundRemaining-=refundVnd;
        const sku=SKU_CATALOG[(i+sIdx)%SKU_CATALOG.length];
        const day=String(session.date||'').split('/');
        const dateISO=day.length===3?day[2]+'-'+day[1]+'-'+day[0]:'2026-10-17';
        const version=lookupRate(rates,sku.id,dateISO);
        if(!version)throw new Error('Thiếu phiên bản tỷ lệ cho '+sku.id);
        const status=refundVnd===paidVnd?'cancelled':refundVnd?'partial_refund':'pending';
        const estimate=calc(paidVnd,refundVnd,version.bps,status);
        // Một số số liệu đã xác nhận hoàn toàn là ví dụ minh họa.
        const hasConfirmed=(i%11===0 && status!=='cancelled');
        const reference=hasConfirmed?estimate.adjusted+(session.id==='DEMO-AFF-002'&&i===0?2000:0):null;
        base.push({
          id:session.id+'-ITEM-'+String(i+1).padStart(3,'0'),
          orderId:session.id+'-ORD-'+String(i+1).padStart(3,'0'),
          sessionId:session.id,creator:session.creator,skuId:sku.id,skuName:sku.name,
          placedAt:dateISO,paidVnd,refundVnd,status,rateBps:version.bps,rateVersionId:version.id,
          tiktokConfirmedVnd:reference,
          source:hasConfirmed?'TikTok demo đã quyết toán':'Chưa có đối soát chính thức'
        });
      }
      if(refundRemaining!==0)throw new Error('Hoàn tiền phiên mẫu lớn hơn doanh thu');
    });
    function enrich(row){
      const over=overrides[row.id]||{};
      const r={...row,...over};
      const amounts=calc(r.paidVnd,r.refundVnd,r.rateBps,r.status);
      const hasConfirmed=r.tiktokConfirmedVnd!==null&&r.tiktokConfirmedVnd!==undefined;
      const difference=hasConfirmed?r.tiktokConfirmedVnd-amounts.adjusted:null;
      return {...r,...amounts,difference,check:!hasConfirmed?'awaiting':Math.abs(difference)<=1?'matched':'mismatch'};
    }
    function allItems(){return base.map(enrich);}
    function forSession(sessionId){return allItems().filter(x=>x.sessionId===sessionId);}
    function stats(sessionId){
      const items=forSession(sessionId);
      return items.reduce((a,item)=>{
        a.estimated+=item.estimated;a.adjusted+=item.adjusted;
        if(item.check!=='awaiting'){a.confirmed+=item.tiktokConfirmedVnd;a.confirmedCount++;}
        if(item.check==='mismatch'){a.mismatchCount++;a.discrepancy+=item.difference;}
        if(item.check==='awaiting')a.pendingCount++;
        return a;
      },{estimated:0,adjusted:0,confirmed:0,confirmedCount:0,pendingCount:0,mismatchCount:0,discrepancy:0});
    }
    function updateItem(id,patch){
      const row=base.find(x=>x.id===id);if(!row)throw new Error('Không tìm thấy dòng đơn');
      const permitted=['refundVnd','status','tiktokConfirmedVnd'];
      if(Object.keys(patch).some(k=>!permitted.includes(k)))throw new Error('Không được sửa dữ liệu gốc hoặc tỷ lệ hoa hồng đã chốt của đơn');
      const merged={...row,...overrides[id],...patch};
      if(!['pending','partial_refund','cancelled','delivered','settled'].includes(merged.status))throw new Error('Trạng thái đơn không hợp lệ');
      if(merged.status==='cancelled' && merged.refundVnd!==merged.paidVnd)throw new Error('Đơn hủy phải hoàn đủ số tiền thực trả');
      if(merged.tiktokConfirmedVnd!==null)assertCurrency(merged.tiktokConfirmedVnd,'Hoa hồng TikTok');
      calc(merged.paidVnd,merged.refundVnd,merged.rateBps,merged.status);
      log('Điều chỉnh dòng đơn',id,{refundVnd:row.refundVnd,...(overrides[id]||{})}, {refundVnd:merged.refundVnd,status:merged.status,tiktokConfirmedVnd:merged.tiktokConfirmedVnd});
      overrides[id]={refundVnd:merged.refundVnd,status:merged.status,tiktokConfirmedVnd:merged.tiktokConfirmedVnd};
      db.setItem(STORE_OVERRIDES,JSON.stringify(overrides));
      return enrich(row);
    }
    function saveRate(skuId,percent,today){
      if(!SKU_CATALOG.some(x=>x.id===skuId))throw new Error('SKU không có trong danh mục');
      const val=Number(percent);
      if(!Number.isFinite(val)||val<0||val>100||Math.round(val*100)!==val*100)throw new Error('Tỷ lệ phải từ 0 đến 100%, tối đa hai chữ số thập phân');
      const bps=Math.round(val*100);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(today))throw new Error('Ngày hiệu lực không hợp lệ');
      const latest=lookupRate(rates,skuId,today);
      if(latest?.bps===bps)return latest;
      const item={id:skuId+'-DEMO-'+Date.now()+'-'+rates.length,skuId,bps,effectiveFrom:today,source:'Cập nhật thủ công trong demo – chỉ cho đơn mới'};
      rates.push(item);
      log('Đổi tỷ lệ SKU',skuId,{rateBps:latest?.bps??null}, {rateBps:bps,effectiveFrom:today});
      db.setItem(STORE_RATES,JSON.stringify(rates.filter(x=>!INITIAL_RATES.includes(x))));
      return item;
    }
    function latestRates(){return SKU_CATALOG.map(x=>({...x,rate:lookupRate(rates,x.id,'9999-12-31')}));}
    function reset(){overrides={};rates.splice(0,rates.length,...INITIAL_RATES);db.removeItem(STORE_RATES);db.removeItem(STORE_OVERRIDES);audit=[];db.removeItem(STORE_AUDIT);}
    return {catalog:SKU_CATALOG,allItems,forSession,stats,updateItem,saveRate,latestRates,getRateHistory:()=>rates.slice().sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom)),getAudit:()=>audit.slice(),reset,calc,lookupRate};
  }
  scope.AffiliateCommission={create,calc,lookupRate,SKU_CATALOG,INITIAL_RATES};
})(typeof window!=='undefined'?window:globalThis);
