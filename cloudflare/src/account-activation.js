
// V69: access request tokens, generated and verified only on Cloudflare Worker.
// A registered user starts as Viewer regardless of client-provided data.
const ROLES=new Set(['Viewer','Host','Ops']);
const TOKEN_RE=/^KB-[A-F0-9]{40}$/;
const sevenDays=7*24*60*60*1000;
const iso=ts=>new Date(ts).toISOString();
function hex(bytes){return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
export async function shaToken(token){
 const raw=new TextEncoder().encode(token);
 const hash=await crypto.subtle.digest('SHA-256',raw);
 return hex(new Uint8Array(hash));
}
export function makeToken(){const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);return 'KB-'+hex(bytes);}
export async function registerIdentity(db,identity){
 const now=Date.now(),ts=iso(now),email=identity.email?.trim().toLowerCase();
 if(!email || !/^.+@.+\..+$/.test(email))throw new Error('Tài khoản Firebase chưa có email hợp lệ');
 const uid=identity.uid;
 const insert=await db.prepare(`INSERT OR IGNORE INTO app_users(firebase_uid,email,display_name,role,active,created_at,email_verified)
   VALUES(?,?,?,'Viewer',1,?,?)`).bind(uid,email,String(identity.name||'').slice(0,100),ts,identity.emailVerified?1:0).run();
 await db.prepare('UPDATE app_users SET email_verified=1 WHERE firebase_uid=? AND email_verified=0 AND ?=1').bind(uid,identity.emailVerified?1:0).run();
 const member=await db.prepare('SELECT role,active FROM app_users WHERE firebase_uid=?').bind(uid).first();
 if(!member?.active)throw new Error('Tài khoản hiện đã bị khóa');
 if((insert.meta?.changes||0)>0){
   const token=makeToken();
   await db.prepare(`INSERT INTO account_activation_requests(firebase_uid,token_hash,status,created_at,expires_at)
    VALUES(?,?,'pending',?,?)`).bind(uid,await shaToken(token),ts,iso(now+sevenDays)).run();
   return {role:'Viewer',activationToken:token,pendingActivation:true};
 }
 const request=await db.prepare('SELECT status FROM account_activation_requests WHERE firebase_uid=?').bind(uid).first();
 return {role:member.role,pendingActivation:request?.status==='pending',registered:true};
}
export async function reissueToken(db,identity){
 const member=await db.prepare('SELECT role,active FROM app_users WHERE firebase_uid=?').bind(identity.uid).first();
 if(!member?.active||member.role!=='Viewer')throw new Error('Chỉ tài khoản Chỉ xem đang chờ duyệt mới được lấy lại mã');
 const old=await db.prepare('SELECT status,created_at FROM account_activation_requests WHERE firebase_uid=?').bind(identity.uid).first();
 if(!old||old.status!=='pending')throw new Error('Tài khoản không có yêu cầu chờ duyệt');
 const now=Date.now(),previous=new Date(old.created_at).getTime();
 if(Number.isFinite(previous)&&now-previous<5*60*1000)throw new Error('Vui lòng chờ 5 phút trước khi cấp lại mã');
 const token=makeToken();
 await db.prepare(`UPDATE account_activation_requests SET token_hash=?,created_at=?,expires_at=?
    WHERE firebase_uid=? AND status='pending'`).bind(await shaToken(token),iso(now),iso(now+sevenDays),identity.uid).run();
 return {activationToken:token,expiresAt:iso(now+sevenDays)};
}
export async function listPending(db){
 const data=await db.prepare(`SELECT r.firebase_uid,u.email,u.display_name,u.email_verified,r.created_at,r.expires_at
 FROM account_activation_requests r JOIN app_users u ON r.firebase_uid=u.firebase_uid
 WHERE r.status='pending' ORDER BY r.created_at DESC LIMIT 100`).all();
 return {items:data.results||[]};
}
export async function approveToken(db,adminUid,payload){
 const code=String(payload?.code||'').trim().toUpperCase(),role=String(payload?.role||'');
 if(!TOKEN_RE.test(code))throw new Error('Mã kích hoạt không đúng định dạng');
 if(!ROLES.has(role))throw new Error('Vai trò chỉ cho phép Viewer, Host hoặc Vận hành');
 const tokenHash=await shaToken(code),now=iso(Date.now());
 const request=await db.prepare(`SELECT firebase_uid FROM account_activation_requests
  WHERE token_hash=? AND status='pending' AND expires_at>?`).bind(tokenHash,now).first();
 if(!request)throw new Error('Mã không tồn tại, đã hết hạn hoặc đã được sử dụng');
 if(request.firebase_uid===adminUid)throw new Error('Không tự kích hoạt tài khoản quản trị');
 const uid=request.firebase_uid;
 const member=await db.prepare('SELECT email_verified FROM app_users WHERE firebase_uid=?').bind(uid).first();
 if(!member?.email_verified)throw new Error('Người đăng ký cần xác minh email Firebase rồi tải lại trang trước khi kích hoạt');
 // D1 batch executes in a transaction; both statements succeed or roll back together.
 const result=await db.batch([
  db.prepare(`UPDATE account_activation_requests SET status='approved', approved_at=?,approved_by=?,approved_role=?
    WHERE firebase_uid=? AND token_hash=? AND status='pending' AND expires_at>?`).bind(now,adminUid,role,uid,tokenHash,now),
  db.prepare(`UPDATE app_users SET role=?,active=1
    WHERE firebase_uid=? AND EXISTS (SELECT 1 FROM account_activation_requests
      WHERE firebase_uid=? AND token_hash=? AND status='approved' AND approved_by=? AND approved_at=?)`).bind(role,uid,uid,tokenHash,adminUid,now)
 ]);
 if(!result?.[0]?.meta?.changes||!result?.[1]?.meta?.changes)throw new Error('Kích hoạt chưa thành công; vui lòng tải lại');
 return {ok:true,role,uid};
}
