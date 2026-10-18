# Triển khai DATA SHOPKHANGBABY: Firebase Hosting + Cloudflare

## 1. Đăng giao diện lên Firebase Hosting

1. Cài Node.js, mở terminal ở thư mục gốc của dự án (nơi có `firebase.json`).
2. Tạo một dự án tại Firebase Console, bật Firebase Hosting.
3. Chạy:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting --project YOUR_FIREBASE_PROJECT_ID
```

`firebase.json` đã trỏ đến thư mục `public/`. Sau khi deploy, Firebase sẽ cấp địa chỉ kiểu `https://...web.app`. Nếu chưa có dự án, tạo bằng Firebase Console trước, không để nguyên chuỗi `YOUR_FIREBASE_PROJECT_ID`.

**Chú ý:** Trang sẽ chạy dưới dạng **demo**; nút đăng nhập chưa làm Google OAuth thực.

## 2. Chuẩn bị Cloudflare D1 và Worker

```bash
cd cloudflare
npm install
npx wrangler login
npx wrangler d1 create shopkhangbaby_db
```

Copy `wrangler.toml.example` thành `wrangler.toml`, thay `database_id`, `FIREBASE_PROJECT_ID` và `FRONTEND_ORIGIN` bằng giá trị thật của bạn. Có thể tạo R2 (nếu tài khoản có quyền và muốn dùng):

```bash
npx wrangler r2 bucket create shopkhangbaby-exports
```

Nếu không dùng R2, comment khối `[[r2_buckets]]` trong `wrangler.toml`. Sau đó chạy:

```bash
npx wrangler d1 migrations apply SHOPKHANGBABY_DB --remote
npx wrangler deploy
```

Endpoint kiểm tra: `https://TEN-WORKER.workers.dev/api/v1/health` (là ví dụ, xem URL thật lúc deploy).

## 3. Phân quyền và bảo vệ dữ liệu

Worker yêu cầu:
- Firebase **ID token thật** đã được xác minh chữ ký và project;
- UID phải có trong bảng `app_users` của Cloudflare D1 với `active=1`.

Sau khi triển khai Firebase Authentication và đã đăng nhập thật, lấy UID của tài khoản quản trị từ Firebase Console. Cấp quyền ban đầu qua môi trường quản trị D1 (ví dụ dưới chỉ là placeholder):

```bash
npx wrangler d1 execute shopkhangbaby_db --remote --command "INSERT INTO app_users (firebase_uid, email, display_name, role, active) VALUES ('REPLACE_WITH_REAL_FIREBASE_UID','admin@example.invalid','Administrator','Admin',1)"
```

**Không chạy nguyên lệnh mẫu.** Phải thay UID/email. Không nhập mật khẩu hoặc token trong bảng D1. Khi dùng cho doanh nghiệp cần kiểm soát role cho từng API, ghi nhật ký, sao lưu và thiết lập quyền chặt chẽ hơn.

## 4. Kết nối frontend đến Worker (bước tiếp theo)

Mở `public/js/runtime-config.js`, đặt `apiBaseUrl` bằng URL Worker HTTPS; lúc triển khai thật phải dùng Firebase Auth để lấy ID token và truyền vào `window.ShopKhangBabyApi.getLiveSessions(idToken)`.

**Quan trọng:** Các màn hình vẫn đọc dữ liệu demo đến khi bạn đổi logic trong `dashboard.js` và `ui.js` sang dữ liệu Worker. Không nên đặt `mode: 'live'` để mong dữ liệu thật tự xuất hiện.

## 5. TikTok Shop / Ads / Affiliate (chưa tích hợp)

- TikTok OAuth, Shop ID, app_key, shop_cipher, advertiser ID, quyền và API thực phải được cấp từ tài khoản của bạn.
- Map ID thật của **@mekhangsua** và **@shopkhangbaby** sang `official_channels.tiktok_creator_id`, giới hạn xử lý ở backend, **không chỉ lọc tên hiển thị**.
- Tách LIVE Affiliate thành nguồn dữ liệu riêng để không cộng trùng KPI Host.
- Đối soát: lưu trạng thái và khoản hoàn theo đơn; cập nhật GMV sau hoàn/hủy từ sự kiện và đồng bộ lại trong thời gian trả hàng.
- Lưu secrets qua `npx wrangler secret put TIKTOK_SHOP_APP_SECRET` (tên biến là ví dụ), không lưu trong file HTML hoặc localStorage.
- Tạo worker cron/webhook có kiểm soát sau khi có API; file mẫu **chưa bật Cron**.

## 6. Vận hành miễn phí / chi phí

Gói miễn phí, quota và quyền sử dụng Firebase/Cloudflare có thể thay đổi. Kiểm tra quota của dự án trong console trước khi thiết lập Cron/dữ liệu lớn. Tự động dọn bộ nhớ trong UI vẫn là **demo**; không tự xóa D1/R2/Firestore thật.

## V43: Thiết lập 3 luồng TikTok tách biệt

Trước khi bật đồng bộ thật, đọc `docs/API_CONNECTIONS.md`: hướng dẫn app/scopes/Shop Cipher cho Seller, Advertiser ID/reporting cho TikTok Ads và Partner authorization/Category Asset Cipher cho TikTok Shop Partner Center. Đây là tài liệu chuẩn bị tích hợp, không phải chứng nhận API đã hoạt động.

## V44 — Partner Token tự gia hạn

Để bật tự động mà không cần mở website, thực hiện thêm các bước tại `docs/API_CONNECTIONS.md` mục 6: migration D1 `0002_partner_token_rotation.sql`, 4 Wrangler Secrets, Cron mỗi 15 phút, Firebase Auth Admin cho API trạng thái. HTML demo **không** tự gia hạn nếu Worker chưa triển khai hoặc chưa có refresh token hợp lệ.
