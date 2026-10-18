
/* V69 — Firebase Auth thật; tuyệt đối không lưu mật khẩu trên website/Worker. */
const config=window.SHOPKHANGBABY_CONFIG;
if(config?.mode==='live'){
 (async()=>{
  try{
   if(!config.apiBaseUrl||!config.firebase?.projectId||!config.firebase?.apiKey||!config.firebase?.authDomain||!config.firebase?.appId)throw new Error('Chưa cấu hình Firebase/Worker.');
   const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,updateProfile,sendPasswordResetEmail,sendEmailVerification}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js')]);
   const auth=getAuth(initializeApp(config.firebase));
   const google=new GoogleAuthProvider();
   window.ShopKhangBabyAuth={
    getToken:async()=>{if(!auth.currentUser)throw new Error('Chưa đăng nhập');return auth.currentUser.getIdToken();},
    signIn:async()=>{try{await signInWithPopup(auth,google);}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code))await signInWithRedirect(auth,google);else throw e;}},
    signInWithEmail:(email,password)=>signInWithEmailAndPassword(auth,email,password),
    register:async(email,password,name)=>{
      const result=await createUserWithEmailAndPassword(auth,email,password);
      await updateProfile(result.user,{displayName:name});
      await sendEmailVerification(result.user).catch(()=>{});
      return result;
    },
    resetPassword:email=>sendPasswordResetEmail(auth,email),
    signOut:()=>signOut(auth)
   };
   window.shopKhangBabyGetIdToken=()=>window.ShopKhangBabyAuth.getToken();
   let currentUid='',currentTask=0;
   let refreshInFlight=false;
   // Recheck server role after auth changes, tab resume and explicit access refresh.
   async function syncServerAccess(user, task, firstLogin=false){
     if(!user || task!==currentTask || refreshInFlight)return;
     refreshInFlight=true;
     try{
       const token=await user.getIdToken(true);
       if(task!==currentTask)return;
       if(firstLogin)await window.ShopKhangBabyApi.register(token);
       const me=await window.ShopKhangBabyApi.me(token);
       if(task!==currentTask)return;
       if(me.uid!==user.uid)throw new Error('UID không khớp: phiên Firebase và D1 không thuộc cùng tài khoản.');
       if(!['Admin','Ops','Host','Viewer'].includes(me.role))throw new Error('Worker trả vai trò không hợp lệ.');
       if(me.role==='Admin' && me.pendingActivation){
         // Pending onboarding is not permission revocation; server still decides access.
         console.info('Account has a pending legacy activation request; server role remains Admin.');
       }
       if(!window.ShopKhangBabyLive || typeof window.ShopKhangBabyLive.signedIn!=='function')throw new Error('Module Dashboard chưa tải.');
       if(!state.signedIn || state.profile?.uid!==user.uid){
         await window.ShopKhangBabyLive.signedIn(user,me);
       }else if(state.role!==me.role){
         state.role=me.role;
         state.previewMemberId=null;
         render();
         toast('Đã đồng bộ quyền tài khoản: '+({Admin:'Quản trị viên',Ops:'Vận hành',Host:'Host',Viewer:'Chỉ xem'}[me.role]),'info');
       }
       currentUid=user.uid;
       // Use server UID/role as the only authority. No email whitelist or localStorage admin override.
       if(firstLogin && me.pendingActivation && me.role==='Viewer')toast('Tài khoản đang chờ kích hoạt.','info');
     }catch(e){
       if(task!==currentTask)return;
       const msg=e?.message||'Không tải được quyền từ máy chủ.';
       if(firstLogin){window.ShopKhangBabyLive?.signedOut();window.ShopKhangBabyLive?.authError('Không đồng bộ được quyền từ Cloudflare: '+msg);}
       else {window.ShopKhangBabyLive?.authError('Lỗi làm mới phân quyền: '+msg);}
       console.error('SERVER_ACCESS_SYNC_FAILED',msg);
     }finally{refreshInFlight=false;}
   }
   window.shopKhangBabyRefreshAccess=()=>auth.currentUser ? syncServerAccess(auth.currentUser,currentTask,false):Promise.reject(new Error('Chưa đăng nhập'));
   onAuthStateChanged(auth,async user=>{
     const task=++currentTask;
     if(!user){currentUid='';window.ShopKhangBabyLive?.signedOut();return;}
     await syncServerAccess(user,task,true);
   });
   document.addEventListener('visibilitychange',()=>{
     if(document.visibilityState==='visible' && auth.currentUser && currentUid===auth.currentUser.uid)syncServerAccess(auth.currentUser,currentTask,false);
   });
   window.addEventListener('focus',()=>{
     if(auth.currentUser && currentUid===auth.currentUser.uid)syncServerAccess(auth.currentUser,currentTask,false);
   });
  }catch(e){window.ShopKhangBabyLive?.authError('Không khởi tạo được Firebase Auth: '+e.message);}
 })();
}
