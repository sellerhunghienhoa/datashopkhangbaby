/* API client để chuẩn bị tích hợp thật; chưa được kích hoạt trong giao diện demo. */
window.ShopKhangBabyApi = Object.freeze({
  async request(path, idToken, options = {}) {
    const base = window.SHOPKHANGBABY_CONFIG?.apiBaseUrl || '';
    if (!base || !idToken) throw new Error('Cần URL Cloudflare Worker và Firebase ID token hợp lệ.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${idToken}`,
          Accept: 'application/json'
        }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Lỗi API: ${response.status}`);
      return payload;
    } finally {
      clearTimeout(timer);
    }
  },
  getLiveSessions(idToken) { return this.request('/api/v1/live-sessions', idToken); },
  getAffiliateSessions(idToken) { return this.request('/api/v1/affiliate-sessions', idToken); },
  getAdsCampaigns(idToken) { return this.request('/api/v1/ads-campaigns', idToken); },
  getPartnerTokenStatus(idToken) { return this.request('/api/v1/partner-token/status', idToken); }
});
