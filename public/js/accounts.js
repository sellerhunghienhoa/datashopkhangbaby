/* DATA SHOPKHANGBABY | Trích từ demo V40 | JS truyền thống, tải theo đúng thứ tự. */
    // Role names and feature grants are mock permissions until verified server-side.
    const TEAM_FEATURES=[
      {id:'overview',title:'Tổng quan'},
      {id:'lives',title:'Phiên LIVE chính thức'},
      {id:'orders',title:'Đối soát đơn hàng'},
      {id:'kpi',title:'KPI Host & vận hành'},
      {id:'editHosts',title:'Gắn / sửa Host LIVE'},
      {id:'manageUsers',title:'Quản lý người dùng'},
      {id:'manageAPI',title:'Kết nối API'},
      {id:'manageStorage',title:'Dọn dẹp bộ nhớ'}
    ];
    const ROLE_NAMES={Admin:'Quản trị viên',Ops:'Vận hành sàn',Host:'Host LIVE',Viewer:'Chỉ xem'};
    const BASE_PERMISSIONS={
      Admin:TEAM_FEATURES.map(p=>p.id),
      Ops:['overview','lives','orders','kpi'],
      Host:['overview','lives','kpi'],
      Viewer:['overview']
    };
    function defaultTeamMembers(){return [
      {id:'owner',name:'ShopKhangBaby',email:'shopkhangbaby@gmail.com',role:'Admin',permissions:[...BASE_PERMISSIONS.Admin],protected:true},
      {id:'ops-demo',name:'Nhân sự vận hành (Demo)',email:'ops@example.com',role:'Ops',permissions:[...BASE_PERMISSIONS.Ops]},
      {id:'host-demo',name:'Nhân sự Host (Demo)',email:'host@example.com',role:'Host',permissions:[...BASE_PERMISSIONS.Host]}
    ];}
    function saveTeamMembers(){localStorage.setItem('dskh_demo_users_v17',JSON.stringify(state.members.filter(m=>m.id!=='owner')));}
    function permissionSet(){
      if(state.previewMemberId){const u=state.members.find(x=>x.id===state.previewMemberId);if(u)return u.permissions;}
      return BASE_PERMISSIONS[state.role]||BASE_PERMISSIONS.Viewer;
    }
    function hasPermission(feature){return permissionSet().includes(feature);}
    function canAccessTab(tab){const key={team:'manageUsers',connect:'manageAPI',storage:'manageStorage'}[tab]||tab;return hasPermission(key);}
    function teamRoleBadge(role){return `<span class="pill ${role==='Admin'?'purple':role==='Ops'?'ok':'warn'}">${ROLE_NAMES[role]||'Chỉ xem'}</span>`;}

// V69: phần duyệt token server-side, tách khỏi danh sách user demo.

function activation69Panel(){
  const live=window.SHOPKHANGBABY_CONFIG?.mode==='live';
  return `<section class="panel activation69"><div class="panel-head"><div><h3>Kích hoạt tài khoản mới</h3><div class="mini">Nhập mã do người đăng ký gửi. Kích hoạt chỉ xác nhận tài khoản, chưa phân quyền nâng cao.</div></div></div>
   <form class="activation69-form" onsubmit="approveAccount69(event)">
     <label>Mã kích hoạt<input id="activation69Token" autocomplete="off" placeholder="Nhập token kích hoạt ở đây ..." required spellcheck="false"/></label>
     <button class="btn primary" type="submit">Kích hoạt</button>
   </form>
   <p class="activation69-demo">${live?'Sau khi kích hoạt, tài khoản sẽ tự xuất hiện trong mục “Quản lý người dùng & phân quyền” với vai trò mặc định <b>Chỉ xem</b>. Sau đó bạn mới đổi quyền tại đó.':'Chế độ DEMO: kích hoạt chỉ thêm tài khoản vào danh sách quản lý người dùng với quyền mặc định Chỉ xem.'}</p>
   <button type="button" class="btn ghost" onclick="loadActivationRequests69()">${live?'Xem yêu cầu đang chờ':'Xem yêu cầu demo'}</button>
   <div id="activation69List" class="activation69-list" aria-live="polite"></div>
  </section>`;
}
async function loadActivationRequests69(){
  const el=document.getElementById('activation69List');if(!el)return;
  const live=window.SHOPKHANGBABY_CONFIG?.mode==='live';
  try{
    const list=live?(await window.ShopKhangBabyApi.activationRequests(await window.shopKhangBabyGetIdToken())).items:
      (window.auth69GetDemoRequests?.()||[]).filter(x=>x.status==='pending');
    el.innerHTML=(list||[]).slice(0,50).map(x=>`<div class="activation69-person"><div><b>${escapeTeam(x.display_name||x.name||'Người đăng ký')}</b><div class="mini">${escapeTeam(x.email)}</div></div><span>${live?(x.email_verified?'Email đã xác minh':'Chưa xác minh email'):'Đang chờ • demo'}</span></div>`).join('')||'<p class="mini">Chưa có yêu cầu chờ duyệt.</p>';
  }catch(e){el.textContent='Không tải được yêu cầu: '+e.message;}
}

async function approveAccount69(event){
  event.preventDefault();
  const code=document.getElementById('activation69Token').value.trim().toUpperCase();
  if(!hasPermission('manageUsers'))return toast('Bạn không có quyền duyệt người dùng','error');
  const live=window.SHOPKHANGBABY_CONFIG?.mode==='live';
  try{
    if(live){
      await window.ShopKhangBabyApi.activateUser(await window.shopKhangBabyGetIdToken(),code,'Viewer');
      toast('Đã kích hoạt tài khoản với vai trò mặc định Chỉ xem. Bạn có thể đổi quyền ở danh sách người dùng.','success');
    }else{
      const list=window.auth69GetDemoRequests?.()||[];
      const request=list.find(x=>x.code===code&&x.status==='pending');
      if(!request)throw new Error('Không tìm thấy mã demo còn hiệu lực');
      request.status='approved';request.role='Viewer';
      window.auth69SetDemoRequests?.(list);
      const email=String(request.email||'').trim().toLowerCase();
      const exists=state.members.some(u=>String(u.email||'').trim().toLowerCase()===email);
      if(!exists){
        state.members.push({id:'demo-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),name:request.name||request.display_name||email.split('@')[0]||'Tài khoản mới',email:request.email||'',role:'Viewer',permissions:[...BASE_PERMISSIONS.Viewer]});
        saveTeamMembers();
      }
      toast('Đã kích hoạt tài khoản demo và thêm vào Quản lý người dùng & phân quyền.','success');
      render();
    }
    document.getElementById('activation69Token').value='';
    loadActivationRequests69();
  }catch(e){toast(e.message||'Không thể kích hoạt tài khoản','error');}
}
window.loadActivationRequests69=loadActivationRequests69;
window.approveAccount69=approveAccount69;



function renderTeam(){
  const userListMarkup=`<section class="panel">
    <div class="panel-head team63-head"><div><h3>Quản lý người dùng & phân quyền</h3><div class="mini">Tài khoản được thêm từ luồng kích hoạt. Tại đây bạn sửa quyền hoặc xóa tài khoản demo.</div></div></div>
    <div class="user-list">${state.members.map(u=>`<div class="user-item ${u.protected?'user-item-owner':''}">
      <div class="profile-avatar profile-avatar-sm" aria-hidden="true">${escapeTeam(initials(u.name))}</div>
      <div class="user-item-info"><h4>${escapeTeam(u.name)} ${u.protected?'<span class="pill purple">Tài khoản chính</span>':''}</h4>
      <div class="mini">${escapeTeam(u.email)}</div><div class="user-tag-list">${teamRoleBadge(u.role)}${u.permissions.filter(x=>!['manageUsers','manageAPI','manageStorage','editHosts'].includes(x)).slice(0,3).map(p=>`<span class="user-mini-tag">${escapeTeam(TEAM_FEATURES.find(f=>f.id===p)?.title||p)}</span>`).join('')}${u.permissions.length>4?`<span class="user-mini-tag">+ ${u.permissions.length-3} quyền khác</span>`:''}</div>
      </div><div class="user-item-actions">${u.protected?'<span class="mini">Được bảo vệ</span>':`<button type="button" class="team-action" onclick="openTeamEditor('${escapeTeam(u.id)}')">${icon('settings')} Sửa quyền</button><button type="button" class="team-action delete" onclick="openDeleteTeamModal('${escapeTeam(u.id)}')">${icon('circle-x')} Xóa</button>`}</div>
    </div>`).join('')}</div>
    <div class="note" style="margin-top:15px"><b>Lưu ý:</b> Khu vực “Kích hoạt tài khoản mới” chỉ dùng để kích hoạt. Sau khi kích hoạt, tài khoản mặc định mang quyền <b>Chỉ xem</b> và sẽ xuất hiện ở đây để bạn chỉnh lại vai trò.</div>
    <div class="note" style="margin-top:10px"><b>Xem thử giới hạn quyền:</b> ${state.members.filter(u=>!u.protected).slice(0,4).map(u=>`<button type="button" class="team-action" style="margin:5px" onclick="previewMember('${escapeTeam(u.id)}')">${escapeTeam(u.name)}</button>`).join('')} <span class="mini">Chỉ xem thử giao diện, không đăng nhập thay người dùng.</span></div>
  </section>`;
  if(window.SHOPKHANGBABY_CONFIG?.mode==='live')return activation69Panel()+userListMarkup+`<section class="panel"><h3>Phân quyền hệ thống</h3><p class="mini">Trong môi trường thật, dữ liệu quyền phải được xác minh ở backend (Firebase Auth + Cloudflare Worker/D1). Bản demo này chủ yếu minh họa giao diện và luồng sử dụng.</p></section>`;
  return activation69Panel()+userListMarkup;
}
function escapeTeam(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function initials(name){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);return (parts.length>1?parts[0][0]+parts[parts.length-1][0]:(parts[0]||'SK').slice(0,2)).toLocaleUpperCase('vi-VN');}
let editingMemberId=null, deletingMemberId=null;
function openTeamEditor(id=''){
  if(!hasPermission('manageUsers'))return toast('Không có quyền quản lý người dùng');
  if(!id)return toast('Phần thêm tài khoản đã được bỏ. Hãy dùng mục Kích hoạt tài khoản mới.');
  const u=state.members.find(x=>x.id===id);
  if(!u||u.protected)return toast('Không thể chỉnh sửa tài khoản chủ');
  editingMemberId=id||null;
  const role=u?.role||'Viewer';
  document.getElementById('teamDialogTitle').textContent='Sửa quyền tài khoản';
  document.getElementById('teamEditFields').innerHTML=`<div class="team-form-content">
    <div class="team-form-fields"><label>Họ và tên<input id="teamNameInput" type="text" required maxlength="100" placeholder="Tên nhân sự" value="${escapeTeam(u?.name||'')}"></label><label>Email tài khoản<input id="teamEmailInput" type="email" required maxlength="160" placeholder="example@gmail.com" value="${escapeTeam(u?.email||'')}"></label>
    <label>Vai trò<select id="teamRoleInput" onchange="presetRolePermissions(this.value)">${Object.entries(ROLE_NAMES).map(([r,label])=>`<option value="${r}" ${role===r?'selected':''}>${label}</option>`).join('')}</select></label></div>
    <div class="permission-heading"><b>Quyền truy cập chi tiết</b><span>Chọn những mục tài khoản được sử dụng</span></div>
    <div class="permission-grid">${TEAM_FEATURES.map(p=>`<label class="permission-check"><input type="checkbox" name="permission" value="${p.id}" ${(u?.permissions||BASE_PERMISSIONS[role]).includes(p.id)?'checked':''}><span>${p.title}</span></label>`).join('')}</div>
    <p class="mini" style="margin-top:14px">Thay vai trò sẽ nạp quyền mặc định; bạn có thể tiếp tục tùy chỉnh từng mục.</p>
  </div>`;
  closeSelectPopover();
  document.getElementById('teamModal').classList.remove('hidden');
  enhanceAllSelects();
  if(!window.matchMedia('(pointer:coarse), (max-width:820px)').matches){
    document.getElementById('teamNameInput').focus({preventScroll:true});
  }
}
    function presetRolePermissions(role){
      const set=new Set(BASE_PERMISSIONS[role]||BASE_PERMISSIONS.Viewer);
      document.querySelectorAll('#teamEditForm input[name="permission"]').forEach(el=>el.checked=set.has(el.value));
    }
    function saveTeamMember(e){
      e.preventDefault();
      if(!hasPermission('manageUsers'))return toast('Bạn không có quyền sửa tài khoản');
      const name=document.getElementById('teamNameInput').value.trim();
      const email=document.getElementById('teamEmailInput').value.trim().toLowerCase();
      const role=document.getElementById('teamRoleInput').value;
      const permissions=Array.from(document.querySelectorAll('#teamEditForm input[name="permission"]:checked')).map(el=>el.value).filter(x=>TEAM_FEATURES.some(p=>p.id===x));
      if(!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast('Nhập tên và email hợp lệ');
      if(!permissions.length)return toast('Chọn ít nhất 1 quyền cho tài khoản');
      if(state.members.some(u=>u.email.toLowerCase()===email && u.id!==editingMemberId))return toast('Email này đã có trong danh sách');
      if(editingMemberId){const u=state.members.find(x=>x.id===editingMemberId);if(!u||u.protected)return toast('Không thể chỉnh sửa tài khoản chủ');Object.assign(u,{name,email,role,permissions});}
      else {return toast('Phần thêm tài khoản đã được bỏ. Hãy dùng mục Kích hoạt tài khoản mới.');}
      saveTeamMembers();closeTeamModal();render();toast('Đã lưu quyền của tài khoản demo');
    }
    function closeTeamModal(){closeSelectPopover();document.getElementById('teamModal').classList.add('hidden');editingMemberId=null;}
    function openDeleteTeamModal(id){
      if(!hasPermission('manageUsers'))return toast('Không có quyền xóa tài khoản');
      const u=state.members.find(x=>x.id===id);
      if(!u||u.protected)return toast('Tài khoản quản trị chính không thể xóa');
      deletingMemberId=id;
      document.getElementById('deleteTeamText').textContent=`Bạn có chắc muốn xóa ${u.name} (${u.email}) khỏi danh sách?`;
      document.getElementById('deleteTeamModal').classList.remove('hidden');
    }
    function closeDeleteTeamModal(){document.getElementById('deleteTeamModal').classList.add('hidden');deletingMemberId=null;}
    function confirmDeleteTeamMember(){
      if(!hasPermission('manageUsers'))return;
      const u=state.members.find(x=>x.id===deletingMemberId);
      if(!u||u.protected)return toast('Không thể xóa tài khoản chủ');
      state.members=state.members.filter(x=>x.id!==deletingMemberId);saveTeamMembers();closeDeleteTeamModal();render();toast('Đã xóa tài khoản con khỏi danh sách demo');
    }
    function previewMember(id){
      if(!hasPermission('manageUsers'))return;
      const member=state.members.find(u=>u.id===id&&!u.protected);
      if(!member)return;
      state.previewMemberId=id;state.role=member.role;state.currentTab='overview';render();toast('Đang xem thử quyền: '+member.name);
    }
    function exitPermissionPreview(){state.previewMemberId=null;state.role='Admin';state.currentTab='team';render();toast('Đã trở lại quyền quản trị demo');}
    // Firebase integration point: call window.setDashboardGoogleUser(user)
    // only from a verified onAuthStateChanged callback. No real OAuth is performed in this file.
    function setDashboardGoogleUser(user){
      if(!user || typeof user!=='object')return;
      state.profile={displayName:String(user.displayName||user.email?.split('@')[0]||'Tài khoản Google').slice(0,120),email:String(user.email||'').slice(0,180),photoURL:(typeof user.photoURL==='string'&&/^https:\/\//i.test(user.photoURL))?user.photoURL:'',uid:String(user.uid||'').slice(0,160),emailVerified:!!user.emailVerified,provider:'Google / Firebase'};
      const owner=state.members.find(member=>member.id==='owner');
      if(owner){owner.name=state.profile.displayName;owner.email=state.profile.email;}
      refreshProfileButton();
      if(state.currentTab==='team')render();
      if(!document.getElementById('profileModal').classList.contains('hidden'))renderProfileModal();
    }
    window.setDashboardGoogleUser=setDashboardGoogleUser;
    function avatarMarkup(profile,large=false,elementId=''){
      const cls=large?'profile-avatar profile-avatar-lg':'profile-avatar profile-avatar-sm';
      const initialsText=escapeTeam(initials(profile.displayName));
      return `<span ${elementId?`id="${elementId}"`: ''} class="${cls}" aria-hidden="true">${profile.photoURL?`<img alt="" src="${escapeTeam(profile.photoURL)}" onerror="this.remove();this.parentNode.textContent='${initialsText}'">`:initialsText}</span>`;
    }
    function refreshProfileButton(){
      const p=state.profile;
      const label=document.getElementById('headerProfileName');
      if(!label)return;
      label.textContent=p.displayName;
      document.getElementById('headerProfileCaption').textContent=p.provider==='demo'?'Tài khoản mẫu':'Tài khoản Google';
      document.getElementById('headerProfileAvatar').outerHTML=avatarMarkup(p,false,'headerProfileAvatar');
      const mobileAvatar=document.getElementById('mobileProfileAvatar');
      if(mobileAvatar)mobileAvatar.outerHTML=avatarMarkup(p,false,'mobileProfileAvatar');
      const mobileName=document.getElementById('mobileProfileName');
      if(mobileName)mobileName.textContent=p.displayName;
      const mobileProfile=document.getElementById('mobileProfileTrigger');
      if(mobileProfile)mobileProfile.setAttribute('aria-label','Mở hồ sơ tài khoản '+p.displayName);
      const r=document.getElementById('returnAdminButton');r.classList.toggle('hidden',!state.previewMemberId && state.role==='Admin');
    }
    async function requestReissueActivation69(){
      if(window.SHOPKHANGBABY_CONFIG?.mode!=='live')return toast('Chỉ cấp lại mã khi đã bật xác thực Live.','info');
      try{const data=await window.ShopKhangBabyApi.reissueActivation(await window.shopKhangBabyGetIdToken());window.showActivationCode(data.activationToken,false);}
      catch(e){toast(e.message||'Không thể cấp lại mã','error');}
    }
    window.requestReissueActivation69=requestReissueActivation69;
    function renderProfileModal(){
      const p=state.profile;
      document.getElementById('profileDialogTitle').textContent='Hồ sơ '+p.displayName;
      const role=state.previewMemberId?'Xem thử: '+(ROLE_NAMES[state.role]||state.role):(ROLE_NAMES[state.role]||state.role);
      document.getElementById('profileModalContent').innerHTML=`
        <div class="profile-identity">${avatarMarkup(p,true)}<div><div class="modal-kicker">${p.provider==='demo'?'HỒ SƠ MẪU':'TÀI KHOẢN GOOGLE'}</div><h3>${escapeTeam(p.displayName)}</h3><p>${escapeTeam(p.email)}</p><div class="profile-chip">${escapeTeam(role)}</div> ${p.emailVerified?'<div class="profile-chip green">Đã xác minh email</div>':''}</div></div>
        <div class="profile-info"><div class="profile-info-row"><span>Tên hiển thị</span><b>${escapeTeam(p.displayName)}</b></div><div class="profile-info-row"><span>Email</span><b>${escapeTeam(p.email)}</b></div><div class="profile-info-row"><span>Vai trò</span><b>${escapeTeam(role)}</b></div><div class="profile-info-row"><span>Trạng thái</span><b>${p.provider==='demo'?'Đang sử dụng tài khoản mẫu':'Đã cung cấp thông tin Firebase'}</b></div></div>
        ${window.SHOPKHANGBABY_CONFIG?.mode==='live'&&state.role==='Viewer'?`<div class="profile-note"><b>Quyền Chỉ xem</b> — Nếu đã làm mất mã kích hoạt, bạn có thể yêu cầu cấp lại. Mã cũ sẽ hết hiệu lực. <button type="button" class="btn ghost" onclick="requestReissueActivation69()">Cấp lại mã kích hoạt</button></div>`:''}
        <div class="profile-note">${p.provider==='demo'?'Bản demo chưa đăng nhập Google thật. Khi tích hợp Firebase Authentication, tên và ảnh đại diện sẽ lấy từ tài khoản Google đã xác thực.':'Tên và ảnh đại diện được cung cấp từ Firebase. Quyền truy cập cần được kiểm tra ở máy chủ.'}</div>`;
    }
    let profileCloseTimer = null;
    let profileReturnFocus = null;
    function openProfileModal(){
      const modal=document.getElementById('profileModal');
      if(!modal) return;
      clearTimeout(profileCloseTimer);
      profileCloseTimer=null;
      if(modal.classList.contains('hidden')) profileReturnFocus=document.activeElement;
      renderProfileModal();
      modal.classList.remove('hidden','is-closing');
      document.body.classList.add('profile-modal-active');
      const dialog=modal.querySelector('.profile-dialog');
      if(dialog) dialog.focus({preventScroll:true});
    }
    function closeProfileModal(immediate=false){
      const modal=document.getElementById('profileModal');
      if(!modal || modal.classList.contains('hidden')) return;
      clearTimeout(profileCloseTimer);
      const reduceMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finish=()=>{
        modal.classList.add('hidden');
        modal.classList.remove('is-closing');
        document.body.classList.remove('profile-modal-active');
        if(!immediate && profileReturnFocus?.isConnected) profileReturnFocus.focus({preventScroll:true});
        profileReturnFocus=null;
        profileCloseTimer=null;
      };
      if(immediate || reduceMotion){finish();return;}
      modal.classList.add('is-closing');
      profileCloseTimer=setTimeout(finish,190);
    }
    function configSafe(s){return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
    function configInput(label, name, hint='', required=false, type='text'){
      const val = localStorage.getItem('dskh_cfg_'+name) || '';
      return `<label class="field">${label}${required?' *':''}<input type="${type}" name="${name}" value="${configSafe(val)}" autocomplete="off" placeholder="Nhập ${configSafe(label.toLowerCase())}"><small>${hint}</small></label>`;
    }
    function secretField(label,key,hint){
      return `<label class="field">${label}<input type="password" name="${key}" placeholder="Không nhập khóa thật trong demo" autocomplete="new-password" readonly onfocus="toast('Khóa bí mật phải nhập trên website đã triển khai an toàn, không nhập trong file HTML demo')"><small>${hint}</small></label>`;
    }
    function connectionGroup(title, description){
      return `<div class="field full api-group-title"><b>${title}</b><span>${description}</span></div>`;
    }
    function connectionReadOnly(label, value, description){
      return `<div class="field"><label>${label}</label><div class="api-readonly-value">${configSafe(value)}</div><small>${configSafe(description)}</small></div>`;
    }
    function integrationFields(){
      if(state.integrationTab==='shop') return `
        <div class="field full api-service-note"><b>TikTok Shop Seller — dữ liệu thuộc shop</b><span>Ủy quyền shop để lấy LIVE, đơn hàng, hoàn/hủy, quyết toán. LIVE chính thức vẫn giới hạn 2 kênh <b>ShopKhangBaby</b> và <b>Mẹ Khang Sữa</b>. Username chỉ là tên hiển thị; phải ánh xạ Creator ID phía máy chủ.</span></div>
        ${connectionGroup('01 · Ứng dụng & định danh', 'Tạo ứng dụng TikTok Shop trong Partner Center; chọn quyền Seller phù hợp.')}
        ${configInput('App Key — TikTok Shop','shop_app_key','App Key lấy trong Partner Center',true)}
        ${configInput('Shop Cipher','shop_cipher','Lấy bằng Get Authorized Shops sau khi seller cấp quyền',true)}
        ${configInput('Shop ID (nếu cần)','shop_id','ID shop bổ sung, không thay thế shop_cipher')}
        ${configInput('Thị trường / khu vực','shop_region','Ví dụ: VN')}
        ${connectionGroup('02 · OAuth & phạm vi truy cập', 'Tài khoản seller cần cấp quyền cho ứng dụng trước khi đọc dữ liệu.')}
        ${configInput('OAuth Redirect URI','shop_redirect','URL HTTPS callback phải đúng URI đăng ký trên TikTok')}
        ${configInput('Scopes đã được cấp','shop_scopes','Bao gồm quyền phân tích Shop, Orders, Return/Refund và Finance theo đúng tính năng được duyệt')}
        ${connectionReadOnly('Authorization URL (Seller)','https://services.tiktokshop.com/open/authorize','URI ROW theo tài liệu chính thức; tạo link ký/giữ state trên backend')}
        ${connectionReadOnly('Token endpoint','https://auth.tiktok-shops.com/api/v2/token/get','Dùng auth_code + grant_type=authorized_code tại backend; làm mới bằng /token/refresh')}
        ${connectionGroup('03 · API & token bí mật', 'App Secret và token chỉ lưu trên Cloudflare Worker Secrets hoặc kho khóa an toàn.')}
        ${configInput('Open API base URL','shop_api_base','https://open-api.tiktokglobalshop.com — không phải URL Partner Center')}
        ${configInput('Shop LIVE API version','shop_live_version','202509 — kiểm tra phiên bản endpoint phù hợp khi triển khai')}
        ${secretField('App Secret (chỉ lưu backend)','shop_app_secret','Cloudflare secret: TTS_SHOP_APP_SECRET')}
        ${secretField('Seller Access Token','shop_access_token','Từ OAuth seller, header x-tts-access-token')}
        ${secretField('Seller Refresh Token','shop_refresh_token','Lưu mã hóa, gia hạn token trên backend')}
        ${secretField('Webhook verification secret (nếu dùng)','shop_webhook_secret','Dùng để xác minh thông báo từ TikTok, không phải trường bắt buộc cho mọi app')}
        <div class="field full api-permission-card"><b>Quyền LIVE Analytics cần kiểm tra</b><span><code>data.shop_analytics.public.read</code> — ví dụ endpoint <code>GET /analytics/202509/shop_lives/performance</code>. Ngoài dữ liệu phiên LIVE, cần đối chiếu đơn hàng và hoàn trả liên tục để ra GMV sau hoàn/hủy chính xác.</span></div>`;
      if(state.integrationTab==='partner') return `
        <div class="field full api-service-note"><b>TikTok Shop Partner Center — ủy quyền Partner riêng</b><span>Partner Center vừa là nơi tạo/quản lý ứng dụng Shop, vừa có API cho dữ liệu thuộc <b>Partner</b>. Không thay thế Seller authorization. Các API thuộc Partner chỉ khả dụng khi loại đối tác và quyền đã được TikTok phê duyệt.</span></div>
        ${connectionGroup('01 · Hồ sơ Partner & ứng dụng', 'Đối chiếu loại đối tác/TSP/TAP/CAP... và dịch vụ đã được duyệt.')}
        ${configInput('Partner App Key','partner_app_key','App Key TikTok Shop của ứng dụng được dùng để xin quyền Partner',true)}
        ${configInput('Service ID (nếu được cấp)','partner_service_id','ID dịch vụ, có thể cần để xây dựng đường dẫn cấp quyền')}
        ${configInput('Loại Partner','partner_type','Ví dụ TSP, TAP, CAP hoặc MCN — tùy hồ sơ được duyệt')}
        ${configInput('Partner ID / định danh tài khoản','partner_id','Chỉ điền nếu TikTok cấp hoặc endpoint yêu cầu')}
        ${connectionGroup('02 · Partner OAuth & phân quyền', 'Ủy quyền Partner sở hữu dữ liệu; không sử dụng mã OAuth Seller thay thế.')}
        ${configInput('Partner Redirect URI','partner_redirect','Callback HTTPS được khai báo trong Partner Center')}
        ${configInput('Partner granted scopes','partner_scopes','Cần partner.authorization.info và quyền API theo loại dịch vụ')}
        ${configInput('Category Asset Cipher','partner_category_cipher','Nhận từ Get Authorized Category Assets sau Partner authorization')}
        ${connectionReadOnly('Partner Authorization URL (ROW)','https://partner.tiktokshop.com/open/authorize','Đường dẫn đăng nhập cấp quyền Partner; link cuối cùng tạo theo hướng dẫn TikTok')}
        ${connectionGroup('03 · API & bí mật', 'Token của Partner phải tách biệt token Seller, đi kèm đúng loại user_type.')}
        ${configInput('Partner API base URL','partner_api_base','Thường https://open-api.tiktokglobalshop.com; tùy API được cấp')}
        ${configInput('Đối tượng API / lĩnh vực','partner_business_category','Chỉ áp dụng nếu API Partner hiện tại yêu cầu')}
        ${secretField('Partner App Secret','partner_app_secret','Nếu dùng chung app Shop, vẫn lưu App Secret tại backend')}
        ${secretField('Partner Access Token','partner_access_token','Access token cấp theo Partner OAuth, không phải Seller token')}
        ${secretField('Partner Refresh Token','partner_refresh_token','Tách token từng chủ sở hữu và hạn dùng')}
        <div class="field full api-permission-card"><b>Kiểm tra Partner Authorization</b><span><code>GET /authorization/202405/category_assets</code> với quyền <code>partner.authorization.info</code>. Trả về tài sản đã được cấp quyền và <code>category_asset_cipher</code> cho những endpoint yêu cầu. Không suy luận loại user_type; xác minh từ phản hồi token thực tế và hướng dẫn API áp dụng.</span></div>`;
      return `
        ${connectionGroup('01 · Firebase Authentication', 'Đăng nhập Google thực và xác thực Firebase ID token tại Cloudflare Worker.')}
        ${configInput('Firebase Project ID','firebase_project','ID dự án Firebase công khai')}
        ${configInput('Firebase Auth Domain','firebase_auth','Ví dụ project.firebaseapp.com')}
        ${configInput('Google OAuth Client ID','google_client','Client ID công khai, không phải Client Secret')}
        ${connectionGroup('02 · Backend Cloudflare', 'Tất cả API TikTok và token chạy ở phía Cloudflare; giao diện chỉ nhận dữ liệu được phân quyền.')}
        ${configInput('Cloudflare Worker API URL','backend_url','HTTPS Worker endpoint, không bao giờ trả lại secret')}
        ${configInput('Cloudflare Account ID','cloudflare_account','Mã tài khoản để quản trị hạ tầng')}
        ${configInput('Timezone đối soát','time_zone','Mặc định Asia/Ho_Chi_Minh')}
        ${configInput('D1 Database binding','cloudflare_d1','Ví dụ DB; cấu hình wrangler.toml')}
        ${configInput('R2 bucket binding (nếu dùng)','cloudflare_r2','Ví dụ EXPORTS; sao lưu / xuất dữ liệu, không dùng nếu không cần')}
        ${secretField('Cloudflare API Token','cf_token','Chỉ đặt trong CI/CD hoặc Cloudflare Secret, không đưa vào frontend')}
        <div class="field full api-permission-card"><b>Quy trình an toàn</b><span>Firebase Auth → Worker kiểm tra ID token và quyền quản trị → thực hiện OAuth/đọc TikTok → lưu token mã hóa an toàn → đồng bộ D1/Queues/Cron → trả về dữ liệu không chứa bí mật. Bản V43 mới là cấu trúc chuẩn bị, chưa kết nối thật.</span></div>`;
    }
