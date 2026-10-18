# DATA SHOPKHANGBABY V50 — Cấu hình một lần, không nhập lại trên website

**V50 chưa tự truy xuất TikTok Shop/Ads** vì chưa có OAuth và scope thật của bạn. V50 hoàn thiện: xác thực Firebase, Worker → D1 → UI và hệ thống ingest/upsert chống trùng, báo trạng thái. Sau khi tích hợp một connector TikTok đáng tin cậy, connector gửi dữ liệu **đã chuẩn hóa** qua endpoint Ingest; bạn không phải nhập vào frontend nữa.

## 1. Tạo hạ tầng

- Firebase Hosting + Authentication Google. Thêm domain `...web.app` vào Authorized Domains trong Firebase.
- Cloudflare D1 database `shopkhangbaby_db` và Worker. Lưu ID D1 trong `cloudflare/wrangler.toml` (copy từ `.example`).
- Cấu hình `FIREBASE_PROJECT_ID`, `FRONTEND_ORIGIN` đúng website Firebase của bạn; không cho Origin `*`.
- `npx wrangler d1 migrations apply shopkhangbaby_db --remote` từ thư mục `cloudflare/`. Các migration 0001-0004 tạo bảng riêng, không xóa dữ liệu cũ.
- `npx wrangler secret put SYNC_INGEST_KEY` (chuỗi dài ngẫu nhiên >= 30 ký tự, **không** lưu vào frontend). Giữ riêng các Partner secrets để Cron gia hạn nếu đã cấp quyền.
- `npx wrangler deploy`.

## 2. Cấp quyền Admin lần đầu (không qua form công khai)

1. Đăng nhập thử bằng Google để biết Firebase UID qua Firebase Console > Authentication > Users.
2. Chạy câu SQL qua Cloudflare D1 console/Cloud Shell. Thay các placeholder thật:

```sql
INSERT INTO app_users (firebase_uid,email,display_name,role,active)
VALUES ('FIREBASE_UID_CUA_BAN','email@gmail.com','Quản trị viên','Admin',1)
ON CONFLICT(firebase_uid) DO UPDATE SET role='Admin', active=1;
```

3. Các tài khoản phụ thêm vào `app_users` riêng. Backend mới thực thi quyền theo role; không dựa vào menu ẩn.

## 3. Bật chế độ Live ở frontend (CHỈ SAU bước 1 và 2)

Trong `public/js/runtime-config.js`, thay `mode:'demo'` thành `mode:'live'`, thêm `apiBaseUrl` Worker và object `firebase` theo Firebase Console (apiKey/authDomain/projectId/appId **là cấu hình public**, không phải App Secret).

Triển khai `firebase deploy --only hosting`. Trong chế độ Live, website **không dùng** 8 phiên demo, 6 phiên Affiliate demo hoặc Ads demo. Người chưa đăng nhập không xem được dashboard.

## 4. Cloud Shell / connector nhập dữ liệu lần đầu (và tự động ở các lượt sau)

Dữ liệu từ TikTok Seller/Ads/Partner phải được chuyển thành JSON theo cấu trúc tương ứng, sau đó gọi Worker. Có thể nối lệnh này sau tác vụ lấy API. Mẫu `cloudflare/examples/seller-live-example.json` **chỉ để thử**, không nhập vào production như dữ liệu thật.

```bash
cd cloudflare
export WORKER_URL='https://YOUR-WORKER.workers.dev'
read -rs SYNC_INGEST_KEY; export SYNC_INGEST_KEY  # dán khóa rồi Enter; không ghi vào lịch sử shell
export SOURCE='seller'
export INPUT='./live-data-real.json'
node scripts/ingest.mjs
```

Nguồn hợp lệ: `seller`, `affiliate`, `ads`, `orders`. Tối đa 100 dòng/batch, script tự chia lô.

- LIVE: `session_id` không trùng; `channel_username` chỉ `shopkhangbaby` hoặc `mekhangsua`.
- Affiliate: `session_id` không trùng.
- Ads: khóa `(advertiser_id,campaign_id,report_date)`.
- Orders: `order_id` không trùng.
- GMV và chi phí trong JSON là **số nguyên VND**, không phải đơn vị xu hoặc USD; connector phải đổi tiền đúng theo phản hồi API. `start/ended_at`, `source_updated_at`, `last_source_update` ở ISO 8601 UTC.
- Gửi lại lô y hệt: `batch_key` từ SHA-256 và không xử lý lặp. Nếu đơn đổi trạng thái, nội dung thay đổi → batch key mới → `UPSERT` cập nhật record; **không cộng doanh số**.
- Nếu nguồn gửi thời điểm cập nhật cũ hơn, `live_sessions` và `order_reconciliations` từ chối ghi đè snapshot mới hơn (khi có timestamp).

**Chú ý kế toán:** `net_gmv_vnd`/`final_amount_vnd` phải dựa vào dữ liệu TikTok chính thức về hoàn/hủy; không tự suy đoán quyết toán đã chốt. Hệ thống giữ `reconciled_at` khi nguồn xác nhận.

## 5. Những phần còn cần hoàn thiện để chạy 24/24 thật

- TikTok Seller OAuth: lấy seller token, danh sách shop, xác định Creator ID cho hai kênh, ký request và phân trang LIVE Analytics theo shop/currency/timezone.
- Seller Orders + Returns/Refunds: webhook hoặc lịch quét lại 15+ ngày tùy cửa sổ hoàn/hủy và thời gian TikTok ghi nhận; đọc settlement để chốt KPI.
- TikTok Ads OAuth/Reporting: lấy advertiser IDs, metrics theo ngày, chặn double count khi dữ liệu ghi nhận và sửa lại.
- Partner OAuth/token tự gia hạn đang có sẵn từ V44 nhưng chỉ hoạt động sau khi cấu hình secret/cron thật.
- Dữ liệu Live và dữ liệu Ads có thể khác định nghĩa GMV; tuyệt đối không cộng hai nguồn để ra doanh thu cuối.
- Backend chưa hỗ trợ chỉnh Host trực tiếp ở chế độ Live: cần API updateHost riêng và nhật ký phân quyền trước khi cho sửa trên production.

## 6. An toàn trước khi chuyển domain thật

- Kiểm thử login/logout ẩn dashboard, tài khoản không có quyền bị 403, Worker không lộ secret.
- Sao lưu D1 trước migration; giữ file `wrangler.toml`/secrets ngoài Git.
- Kiểm tra bản ghi LIVE ID, Order ID, hoàn/hủy, trạng thái đối soát và số chính thức trên Seller Center ít nhất một kỳ.
- Cloudflare Cron hiện chỉ kiểm tra Partner token; **chưa có Cron lấy LIVE/Ads** nếu chưa tích hợp adapter TikTok thật. Không gọi đó là '24/24 đã hoạt động'.
