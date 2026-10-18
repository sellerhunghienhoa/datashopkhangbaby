/* Production: no synthetic Firebase/D1/R2 metrics and no browser-side deletion. */
function loadStorageDemoState(){}
function installStorageDemoTimer(){}
function renderStorage(){
  return `<section class="panel"><h3>🛡️ Tự động dọn dẹp</h3><p class="mini">Chưa kích hoạt trên backend. Dọn dẹp định kỳ chỉ được bật sau khi có Worker Cron, danh sách đối tượng được phép xóa, kiểm tra nhật ký, backup và giới hạn an toàn.</p><span class="pill warn">Chưa cấu hình</span></section>
  <section class="panel"><h3>☁️ Dung lượng bộ nhớ</h3><p class="mini">Chưa kết nối API đo đạc thực tế. Hệ thống không hiển thị dung lượng mẫu.</p><div class="storage-merged-sources">${[['Firebase Firestore','Cần tích hợp Firebase Usage'],['Cloudflare D1','Cần tích hợp API usage'],['Cloudflare R2','Cần tích hợp API usage']].map(([name,status])=>`<div class="storage-source storage-merged-source"><b>${name}</b><p class="mini">${status}</p><span class="pill warn">Chưa có số liệu</span></div>`).join('')}</div></section>`;
}
