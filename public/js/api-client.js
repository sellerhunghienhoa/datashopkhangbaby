/* V50: Firebase ID token => Cloudflare Worker (không chứa App Secret phía browser). */
window.ShopKhangBabyApi = Object.freeze({
  async request(path, idToken, options = {}) {
    const base = window.SHOPKHANGBABY_CONFIG?.apiBaseUrl || '';
    if (!base || !idToken) throw new Error('Cần Worker API URL và Firebase ID token hợp lệ.');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(`${base.replace(/\/$/,'')}${path}`, {
        ...options, signal:controller.signal,
        headers:{...options.headers,Authorization:`Bearer ${idToken}`,Accept:'application/json'}
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||`HTTP ${response.status}`);
      return payload;
    }finally{clearTimeout(timer);}
  },
  me(token){return this.request('/api/v1/me',token);},
  register(token){return this.request('/api/v1/registration',token,{method:'POST'});},
  reissueActivation(token){return this.request('/api/v1/registration/reissue',token,{method:'POST'});},
  activationRequests(token){return this.request('/api/v1/activation-requests',token);},
  activateUser(token,code,role){return this.request('/api/v1/activation-requests/approve',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,role})});},
  syncStatus(token){return this.request('/api/v1/sync/status',token);},
  getLiveSessions(token,page=1,limit=100){return this.request(`/api/v1/live-sessions?page=${page}&limit=${limit}`,token);},
  getAffiliateSessions(token,page=1,limit=100){return this.request(`/api/v1/affiliate-sessions?page=${page}&limit=${limit}`,token);},
  getAdsCampaigns(token,page=1,limit=100){return this.request(`/api/v1/ads-campaigns?page=${page}&limit=${limit}`,token);},
  getPartnerTokenStatus(token){return this.request('/api/v1/partner-token/status',token);}
});
