
/* V69 — đăng nhập nhiều cách. Demo KHÔNG xác thực mật khẩu; Live: Firebase Auth. */
const auth69Live=()=>true;
let auth69DemoRequests=[];
function auth69GetDemoRequests(){return auth69DemoRequests;}
function auth69SetDemoRequests(items){auth69DemoRequests=items;}
window.auth69GetDemoRequests=auth69GetDemoRequests;
window.auth69SetDemoRequests=auth69SetDemoRequests;
function auth69Message(message,error=false){const el=document.getElementById('auth69Message');if(!el)return;el.textContent=message;el.classList.toggle('error',error);}
let auth69CurrentPanel='login';
function clearAuthPanelFields(){
  // No form draft carries across sign-in, registration or password reset.
  // Reset values explicitly because some mobile browsers restore input state.
  for(const formId of ['auth69Login','auth69Register','auth69Reset']){
    const form=document.getElementById(formId);
    if(!form)continue;
    form.reset();
    form.querySelectorAll('input, textarea').forEach(field=>{field.value='';});
  }
}
function setAuthPanel(panel){
  if(panel!==auth69CurrentPanel){
    if(document.activeElement?.matches?.('#loginScreen input'))document.activeElement.blur();
    clearAuthPanelFields();
    auth69CurrentPanel=panel;
  }
  const reset=panel==='reset';
  document.getElementById('auth69Login').classList.toggle('hidden',panel!=='login');
  document.getElementById('auth69Register').classList.toggle('hidden',panel!=='register');
  document.getElementById('auth69Reset').classList.toggle('hidden',!reset);
  document.getElementById('auth69GoogleGroup').classList.toggle('hidden',reset);
  document.getElementById('auth69TabLogin').classList.toggle('is-active',panel==='login'||reset);
  document.getElementById('auth69TabRegister').classList.toggle('is-active',panel==='register');
  document.getElementById('auth69TabLogin').setAttribute('aria-selected',String(panel==='login'||reset));
  document.getElementById('auth69TabRegister').setAttribute('aria-selected',String(panel==='register'));
  document.getElementById('auth69Heading').textContent=panel==='register'?'Đăng ký tài khoản':reset?'Lấy lại mật khẩu':'Đăng nhập dashboard';
  auth69Message('');
}
function auth69FriendlyError(error){
 const code=error?.code||'';
 if(code==='auth/invalid-email')return 'Email không hợp lệ.';
 if(['auth/invalid-credential','auth/wrong-password','auth/user-not-found'].includes(code))return 'Email hoặc mật khẩu không đúng.';
 if(code==='auth/email-already-in-use')return 'Email đã được đăng ký. Hãy đăng nhập hoặc khôi phục mật khẩu.';
 if(code==='auth/weak-password')return 'Mật khẩu quá yếu. Dùng ít nhất 8 ký tự.';
 if(code==='auth/too-many-requests')return 'Thao tác quá nhiều lần. Vui lòng thử lại sau.';
 return String(error?.message||'Có lỗi, vui lòng thử lại.').slice(0,180);
}
async function submitEmailSignIn(event){
 event.preventDefault();
 if(!auth69Live())return auth69Message('Bản demo không xác thực mật khẩu. Bật chế độ Live và cấu hình Firebase Auth để đăng nhập email.',true);
 const btn=event.target.querySelector('[type=submit]');btn.disabled=true;
 try{await window.ShopKhangBabyAuth.signInWithEmail(document.getElementById('auth69LoginEmail').value.trim(),document.getElementById('auth69LoginPassword').value);}
 catch(e){auth69Message(auth69FriendlyError(e),true);}finally{btn.disabled=false;document.getElementById('auth69LoginPassword').value='';}
}
async function submitRegistration(event){
 event.preventDefault();
 const name=document.getElementById('auth69RegisterName').value.trim();
 const email=document.getElementById('auth69RegisterEmail').value.trim();
 const pass=document.getElementById('auth69RegisterPassword').value;
 const confirm=document.getElementById('auth69RegisterConfirm').value;
 if(name.length<2||pass.length<8||pass!==confirm)return auth69Message('Nhập tên ít nhất 2 ký tự, mật khẩu ít nhất 8 ký tự và xác nhận trùng khớp.',true);
 const btn=event.target.querySelector('[type=submit]');btn.disabled=true;
 try{
   if(auth69Live()){
     await window.ShopKhangBabyAuth.register(email,pass,name);
     auth69Message('Đã tạo tài khoản Firebase. Đang nhận mã kích hoạt…');
   }else{
     // Demo không lưu mật khẩu và KHÔNG tạo tài khoản thật.
     const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
     const code='DEMO-KB-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
     const requests=window.auth69GetDemoRequests();
     requests.unshift({name,email,code,status:'pending',createdAt:new Date().toISOString()});
     window.auth69SetDemoRequests(requests.slice(0,30));
     showActivationCode(code,true);
     auth69Message('Đăng ký mô phỏng thành công. Mật khẩu không được lưu; dùng Google Demo để thử dashboard.');
   }
 }catch(e){auth69Message(auth69FriendlyError(e),true);}finally{
  document.getElementById('auth69RegisterPassword').value='';
  document.getElementById('auth69RegisterConfirm').value='';btn.disabled=false;
 }
}
async function submitPasswordReset(event){
 event.preventDefault();
 if(!auth69Live())return auth69Message('Gửi email khôi phục chỉ hoạt động khi bật Firebase Auth Live.',true);
 const btn=event.target.querySelector('[type=submit]');btn.disabled=true;
 try{
   await window.ShopKhangBabyAuth.resetPassword(document.getElementById('auth69ResetEmail').value.trim());
   auth69Message('Nếu email hợp lệ và đã đăng ký, bạn sẽ nhận liên kết khôi phục. Kiểm tra cả thư rác.');
 }catch(e){auth69Message(auth69FriendlyError(e),true);}finally{btn.disabled=false;}
}
function showActivationCode(code,demo=false){
 const modal=document.getElementById('auth69CodeModal');
 document.getElementById('auth69CodeText').textContent=code;
 document.getElementById('auth69CodeNote').textContent=demo?'Đây chỉ là mã demo, không cấp quyền thật và không được gửi như mã kích hoạt production.':'Đây là mã một lần, hiệu lực 7 ngày. Chỉ quản trị viên đã xác thực mới có thể duyệt.';
 modal.classList.remove('hidden');
}
function closeActivationCode(){const code=document.getElementById('auth69CodeText');code.textContent='';document.getElementById('auth69CodeModal').classList.add('hidden');}
async function copyActivationCode(){
 const code=document.getElementById('auth69CodeText').textContent;
 try{await navigator.clipboard.writeText(code);toast('Đã sao chép mã kích hoạt');}
 catch{toast('Hãy bôi đen và sao chép mã theo cách thông thường.','info');}
}
window.setAuthPanel=setAuthPanel;
window.submitEmailSignIn=submitEmailSignIn;
window.submitRegistration=submitRegistration;
window.submitPasswordReset=submitPasswordReset;
window.showActivationCode=showActivationCode;
window.copyActivationCode=copyActivationCode;
window.closeActivationCode=closeActivationCode;
