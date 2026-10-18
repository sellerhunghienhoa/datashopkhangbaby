// V50 — Chạy trong Cloud Shell/CI/connector đã được cấp quyền.
// SOURCE=seller|orders INPUT=./snapshot.json
// WORKER_URL=https://... SYNC_INGEST_KEY=... node scripts/ingest.mjs
// Không đưa SYNC_INGEST_KEY hoặc TikTok token vào frontend.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=process.env.SOURCE||'';
const path=process.env.INPUT||'';
const url=process.env.WORKER_URL||'';
const key=process.env.SYNC_INGEST_KEY||'';
if(!['seller','orders'].includes(source)||!path||!/^https:\/\//.test(url)||key.length<30){
  console.error('Thiếu SOURCE, INPUT, WORKER_URL (https) hoặc SYNC_INGEST_KEY (>=30 ký tự)');
  process.exit(2);
}
let items;
try{
  const parsed=JSON.parse(await readFile(path,'utf8'));
  items=Array.isArray(parsed)?parsed:parsed.items;
  if(!Array.isArray(items)||items.length===0)throw Error('Không có items');
}catch(e){console.error('Không đọc được file JSON:',e.message);process.exit(2);}
let total=0,skipped=0;
for(let i=0;i<items.length;i+=100){
  const chunk=items.slice(i,i+100);
  // hash nội dung: gửi lại cùng batch không tăng thêm hay ghi lặp;
  // khi dữ liệu thay đổi (refund, đơn hoàn, v.v.) => hash mới và UPSERT.
  const batchKey=createHash('sha256').update(JSON.stringify([source,chunk])).digest('hex');
  const response=await fetch(url.replace(/\/$/,'')+'/api/v1/ingest/'+source,{
    method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
    body:JSON.stringify({batch_key:batchKey,items:chunk})
  });
  const result=await response.json().catch(()=>({error:'Bad JSON response'}));
  if(!response.ok){console.error(`Batch ${Math.floor(i/100)+1}:`,result.error||`HTTP ${response.status}`);process.exit(1);}
  total+=result.processed||0;
  if(result.already_processed)skipped++;
  console.log(`Batch ${Math.floor(i/100)+1}: ${result.already_processed?'đã xử lý trước đó':'đã upsert '+result.processed+' dòng'}`);
}
console.log(`Xong: ${total} lượt ghi, ${skipped} batch đã tồn tại. Dữ liệu có thể đọc từ website sau khi đăng nhập Firebase.`);
