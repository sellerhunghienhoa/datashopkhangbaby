// Chỉ kích hoạt trong mode live; không có Google/Firebase giả ở chế độ production.
const config=window.SHOPKHANGBABY_CONFIG;
if(config?.mode==='live'){
  (async()=>{
    try{
      if(!config.apiBaseUrl || !config.firebase?.projectId || !config.firebase?.apiKey || !config.firebase?.authDomain || !config.firebase?.appId){
        throw new Error('Chưa cấu hình Worker API và Firebase Authentication.');
      }
      const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,onAuthStateChanged}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js')
      ]);
      const app=initializeApp(config.firebase);
      const auth=getAuth(app);
      const provider=new GoogleAuthProvider();
      window.ShopKhangBabyAuth={
        getToken:async()=>{
          if(!auth.currentUser)throw new Error('Chưa đăng nhập Firebase');
          return auth.currentUser.getIdToken();
        },
        signIn:async()=>{
          try{await signInWithPopup(auth,provider);}
          catch(err){
            if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(err.code)){
              await signInWithRedirect(auth,provider);return;
            }
            throw err;
          }
        },
        signOut:()=>signOut(auth)
      };
      window.shopKhangBabyGetIdToken=()=>window.ShopKhangBabyAuth.getToken();
      onAuthStateChanged(auth,async user=>{
        if(!user){window.ShopKhangBabyLive?.signedOut();return;}
        try{
          const token=await user.getIdToken();
          const me=await window.ShopKhangBabyApi.me(token);
          await window.ShopKhangBabyLive.signedIn(user,me);
        }catch(e){
          window.ShopKhangBabyLive?.signedOut();
          window.ShopKhangBabyLive?.authError(e.message||'Tài khoản chưa được cấp quyền.');
        }
      });
    }catch(e){
      window.ShopKhangBabyLive?.authError('Không khởi tạo được đăng nhập thật: '+e.message);
    }
  })();
}
