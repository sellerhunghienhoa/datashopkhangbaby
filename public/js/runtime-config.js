/* Đổi mode sang 'live' CHỈ SAU khi đã triển khai Worker, D1, Firebase Auth và cấp quyền trong app_users.
   Các giá trị Firebase ở đây là public client configuration, KHÔNG đặt App Secret / TikTok token. */
window.SHOPKHANGBABY_CONFIG = Object.freeze({
  mode: 'demo',
  apiBaseUrl: '',
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: ''
  }
});
