
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
   onAuthStateChanged(auth,async user=>{
    const task=++currentTask;
    if(!user){currentUid='';window.ShopKhangBabyLive?.signedOut();return;}
    try{
      const token=await user.getIdToken(true);
      // Token đăng ký chỉ cấp trong lần đầu; role Viewer do SERVER quyết định.
      const registered=await window.ShopKhangBabyApi.register(token);
      const me=await window.ShopKhangBabyApi.me(token);
      if(task!==currentTask)return;
      await window.ShopKhangBabyLive.signedIn(user,me);
      if(registered.activationToken)window.showActivationCode(registered.activationToken,false);
      else if(me.pendingActivation){toast('Tài khoản đang ở quyền Chỉ xem. Gửi mã kích hoạt cho quản trị viên.','info');}
      currentUid=user.uid;
    }catch(e){if(task!==currentTask)return;window.ShopKhangBabyLive?.signedOut();window.ShopKhangBabyLive?.authError(e.message||'Không thể xác thực tài khoản.');}
   });
  }catch(e){window.ShopKhangBabyLive?.authError('Không khởi tạo được Firebase Auth: '+e.message);}
 })();
}
