const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const ctx={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/js/affiliate-commission.js'),'utf8'),ctx);
const E=ctx.AffiliateCommission;
assert.equal(E.calc(1_000_000,0,1000,'pending').estimated,100000);
assert.equal(E.calc(2_000_000,400000,1500,'partial_refund').adjusted,240000);
assert.equal(E.calc(500000,500000,500,'cancelled').adjusted,0);
assert.throws(()=>E.calc(100,101,1000,'pending'));
const mem=new Map();const storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
const sessions=[{id:'DEMO-AFF-X',creator:'Ví dụ',date:'15/10/2026',orders:5,gross:1000000,refund:100000},{id:'DEMO-AFF-Y',creator:'Ví dụ',date:'17/10/2026',orders:3,gross:900000,refund:0}];
const ledger=E.create(sessions,storage);
let rows=ledger.allItems();assert.equal(rows.length,8);
assert.equal(rows.reduce((a,x)=>a+x.paidVnd,0),1900000);
assert.equal(rows.reduce((a,x)=>a+x.refundVnd,0),100000);
const first=rows[0];assert.equal(first.rateBps,1000); // day 15 = old rate
assert.equal(E.lookupRate(E.INITIAL_RATES,'SKU-SUA-01','2026-10-17').bps,1100); // day 17 = new rate
const prev=first.adjusted;
ledger.saveRate(first.skuId,25,'2026-10-18');assert.equal(ledger.allItems()[0].adjusted,prev);
assert.equal(ledger.latestRates().find(x=>x.id===first.skuId).rate.bps,2500);
const line=rows[1];ledger.updateItem(line.id,{refundVnd:line.paidVnd,status:'cancelled',tiktokConfirmedVnd:0});
assert.equal(ledger.allItems()[1].adjusted,0);assert.equal(ledger.allItems()[1].check,'matched');
ledger.updateItem(line.id,{refundVnd:0,status:'pending',tiktokConfirmedVnd:2});
assert.equal(ledger.allItems()[1].check,'mismatch');
assert.throws(()=>ledger.updateItem(line.id,{paidVnd:0}));
const reloaded=E.create(sessions,storage);assert.equal(reloaded.allItems()[1].tiktokConfirmedVnd,2);
assert.equal(reloaded.allItems()[0].rateBps,1000);
ledger.reset();assert.equal(ledger.allItems()[1].tiktokConfirmedVnd,rows[1].tiktokConfirmedVnd);
console.log('V47: 13 tests passed');
