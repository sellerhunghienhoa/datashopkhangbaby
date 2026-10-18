# DATA SHOPKHANGBABY — kết nối TikTok Shop Seller / TikTok Ads / Partner Center (V43)

> ĐÂY LÀ DANH SÁCH CẤU HÌNH VÀ QUY TRÌNH THAM KHẢO, KHÔNG PHẢI KẾT NỐI API TỰ ĐỘNG.
> HTML demo chưa có Google/Firebase OAuth thật, TikTok OAuth thật hay đồng bộ TikTok. Không nhập khóa vào HTML.

## Mô hình quyền dữ liệu

| Nguồn | Chủ dữ liệu cấp quyền | Thông tin cần | Dữ liệu dự kiến |
|---|---|---|---|
| TikTok Shop Seller | Seller/shop của bạn | App Key, App Secret (backend), seller OAuth, shop_cipher, scopes, shop ID tùy API | LIVE official, đơn, hoàn trả, tài chính |
| TikTok Ads | TikTok Business Advertiser | App ID, App Secret (backend), advertiser ID, advertiser OAuth/token, scopes/reporting | Chi tiêu, Campaign/Ad Group/Ad, báo cáo |
| TikTok Shop Partner Center | Partner được TikTok phê duyệt | App Key, App Secret (backend), Partner OAuth/token, service ID (nếu có), scopes, category_asset_cipher (nếu cần) | Tài sản/hợp tác Partner, Affiliate Partner nếu được duyệt |
| Affiliate Seller/Creator | Seller hoặc Creator/Partner tương ứng | Shop Cipher, Affiliate scopes, Creator ID và có thể thêm Creator/Partner OAuth | Affiliate order, creator, commission; LIVE creator tùy quyền |

**Partner Center không phải API token thay thế Seller/Ads.** Nơi này vừa quản lý app cho TikTok Shop vừa hỗ trợ cơ chế ủy quyền Partner cho API tài sản Partner tùy quyền. Cần xác nhận chức năng được bật theo thị trường và loại tài khoản thực tế.

## 1. TikTok Shop Seller

1. Tạo app trong TikTok Shop Partner Center, lấy `app_key`/`app_secret`, cấu hình callback HTTPS và scopes được cấp.
2. Tạo **Seller authorization flow** (ROW: `https://services.tiktokshop.com/open/authorize`), bảo vệ OAuth `state` và callback ở Cloudflare Worker.
3. Server đổi authorization code thành token qua `https://auth.tiktok-shops.com/api/v2/token/get` với `grant_type=authorized_code`; gia hạn qua `/api/v2/token/refresh`.
4. Lấy `shop_cipher` từ Get Authorized Shops; với API thế hệ mới dùng header `x-tts-access-token`, query `app_key`, `timestamp`, và `sign` được HMAC ký ở backend.
5. Ví dụ quyền `data.shop_analytics.public.read` cho `/analytics/202509/shop_lives/performance`, `account_type=OFFICIAL_ACCOUNTS` theo API hỗ trợ. Chỉ lọc dữ liệu kênh `@mekhangsua` và `@shopkhangbaby` sau khi kiểm tra mapping Creator ID thật. Nếu kênh nằm ở marketing-account, xin đúng quyền và áp dụng lọc phù hợp.
6. Đơn hàng hoàn/hủy, hoa hồng, quyết toán cần endpoint và scopes tương ứng; webhook kết hợp backfill để tránh chốt GMV sai.

## 2. TikTok Ads

1. Đăng ký TikTok API for Business và xin quyền đọc dữ liệu quảng cáo/reporting.
2. Tạo App ID/Secret, Redirect URI. Advertiser cần ủy quyền vào app. Dùng access token đúng advertiser; Business Center ID chỉ là thông tin liên kết khi có dùng BC.
3. Endpoint ví dụ v1.3: `https://business-api.tiktok.com/open_api/v1.3/...`; sử dụng header `Access-Token`, query `advertiser_id` khi endpoint yêu cầu.
4. Đồng bộ Campaign, Ad Group, Ad và Reporting (spend, impressions, clicks, CTR, CPC, CPM, conversions, CPA, ROAS); metric Shop/GMV Max có thể cần quyền cụ thể khác.
5. Đừng cộng doanh thu quy gán quảng cáo với GMV Seller để tránh đếm trùng.

## 3. TikTok Shop Partner Center

1. Hoàn thành đăng ký loại đối tác (ví dụ TSP/TAP/CAP/MCN), được phê duyệt dịch vụ và quyền cần dùng.
2. Nếu dữ liệu thuộc Partner, chạy **Partner authorization** (ROW: `https://partner.tiktokshop.com/open/authorize`), tách biệt với Seller authorization. `Service ID` chỉ điền khi luồng/ứng dụng yêu cầu.
3. Lấy Partner token và kiểm tra loại `user_type` trong phản hồi thực tế; không hard-code một loại dùng cho mọi luồng.
4. Nếu quyền `partner.authorization.info` đã được cấp, có thể gọi `GET /authorization/202405/category_assets` để lấy `category_asset_cipher` (khi endpoint Partner yêu cầu), dùng nguồn tài sản tương ứng.
5. Đừng coi Partner Center login là bằng chứng có quyền xem LIVE Affiliate của mọi Creator. Quyền truy cập theo API, thị trường, tài khoản, scope được duyệt.

## 4. Bảo vệ secrets và xác thực

- Không lưu App Secret/Access Token/Refresh Token ở JS frontend, Firestore public, localStorage, ZIP hoặc log.
- Dùng Cloudflare Worker server-side `wrangler secret put ...` cho App Secret, OAuth token xử lý phía backend và kho token mã hóa an toàn có hạn dùng/rotation; không phải cứ gọi `wrangler secret put` là đủ cho token động đổi thường xuyên.
- Bảo vệ các tuyến OAuth `state`, callback, webhook signature, CSRF. Hạn chế quyền write; UI V43 chỉ cho nhập ID không nhạy cảm.
- Firebase ID token phải được Worker xác minh. Server kiểm tra quyền `manageAPI` của admin ở D1, không dựa vào việc ẩn tab ở giao diện.
- Phân biệt 3 loại trạng thái: `Chưa cấu hình`, `Đã điền mục tham khảo`, `Đã xác thực bằng API thực`. V43 chỉ làm được hai trạng thái đầu.

## 5. Webhook và đối soát

- Đồng bộ LIVE sau khi phiên kết thúc theo Creator ID chính xác.
- Poll thay đổi đơn hàng/hoàn trả, hỗ trợ webhook có chữ ký, ghi lại timestamp đối soát và xử lý trùng theo ID/event ID.
- Thời gian hậu kiểm phải đáp ứng chính sách hoàn trả áp dụng ở thị trường của shop; không tự coi đủ 15 ngày nếu TikTok thay đổi chính sách.
- TikTok Ads/Partner Center dùng quota và khả năng API theo trạng thái phê duyệt thực tế; Worker Cron và retry exponential backoff phải tôn trọng giới hạn.

## Tài liệu chính thức (tham khảo, API có thể thay đổi)

- Tạo App TikTok Shop: https://partner.tiktokshop.com/docv2/page/create-your-app
- Thông số TikTok Shop: https://partner.tiktokshop.com/docv2/page/common-parameters
- Shop LIVE performance: https://partner.tiktokshop.com/docv2/page/get-shop-live-performance-list-202509
- Partner assets: https://partner.tiktokshop.com/docv2/page/get-authorized-category-assets-202405
- TikTok API for Business: https://business-api.tiktok.com/
- Ads API identity example: https://business-api.tiktok.com/portal/docs/get-the-identity-list/v1.3

## 6. V44 — Tự động gia hạn TikTok Shop Partner token

TikTok Shop có API `GET https://auth.tiktok-shops.com/api/v2/token/refresh` với `app_key`, `app_secret`, `refresh_token`, `grant_type=refresh_token`. Đây là luồng **TikTok Shop Partner OAuth**, không được nhầm với TikTok Ads OAuth hoặc token thử nghiệm được tạo bằng Developer Tool. Đừng mặc định tất cả access token đều có hạn 4 giờ: dùng `access_token_expire_in` TikTok trả về (thường là thời điểm Unix), không tính bừa thời hạn.

Từ V44, Cloudflare Worker có Cron `*/15 * * * *`, tự làm mới khi access token chỉ còn <= 30 phút; các lần kiểm tra không đến hạn sẽ không gọi TikTok. Worker xử lý token thực ở backend, ghi vào D1 dạng AES-GCM và giữ cả `refresh_token` mới nếu TikTok xoay vòng. Nếu refresh bị lỗi, chạy lại với backoff; khi refresh token hết hạn sẽ cần ủy quyền lại.

### Bước cấu hình thật (không thực hiện trong HTML demo)

1. Cấu hình Cloudflare D1 và Firebase project như file `docs/DEPLOY.md`. Phải chạy cả migration `0002_partner_token_rotation.sql`.
2. Đổi tên `wrangler.toml.example` -> `wrangler.toml`, điền D1 ID; `wrangler.toml` trong ZIP đã bật `[triggers] crons=["*/15 * * * *"]`. Không bật biến production trong frontend.
3. Tại thư mục `cloudflare/`, đặt 4 bí mật bằng CLI (gõ giá trị vào prompt, không lưu vào repo):
   - `npx wrangler secret put PARTNER_APP_KEY`
   - `npx wrangler secret put PARTNER_APP_SECRET`
   - `npx wrangler secret put PARTNER_INITIAL_REFRESH_TOKEN`
   - `npx wrangler secret put PARTNER_TOKEN_ENCRYPTION_KEY`
4. Sinh khóa mã hóa (chỉ dùng trong máy tin cậy), ví dụ `openssl rand -base64 32`. Giữ nguyên khóa này trong các lần triển khai; mất khóa sẽ không giải mã được token D1 cũ và phải cấp quyền lại.
5. Lấy **refresh token Partner ban đầu từ quy trình ủy quyền hợp lệ** (Partner authorize -> callback -> Get Access Token), **không** dán token từ trình duyệt vào form demo. Phân biệt user_type Seller (0), Creator (1) và Partner (2/3 tùy tài liệu/loại API). V44 chấp nhận loại Partner 2 hoặc 3 khi TikTok trả về để ngăn nhầm token Seller.
6. Chạy `npm install`, `npm run migrate:remote`, `npm run deploy`. Chờ Cron đầu tiên hoặc gọi endpoint refresh với Firebase ID token của Admin; xem trạng thái Admin qua `GET /api/v1/partner-token/status`. Đầu ra chỉ là thời điểm, trạng thái; không trả token.
7. Khi lần gia hạn đầu thành công, có thể xóa `PARTNER_INITIAL_REFRESH_TOKEN` khỏi Cloudflare Secrets vì Worker đã lưu phiên bản đã xoay vào D1. Giữ nguyên bảng D1 và khóa AES, không xóa khi dọn bộ nhớ.
8. Cần tích hợp Firebase Google Authentication **thật** trong frontend và cấu hình `window.shopKhangBabyGetIdToken()` để nút “Kiểm tra trạng thái” truy cập endpoint Admin. Chưa có Firebase Auth thì nút chỉ báo thiếu cấu hình, không phỏng đoán token đã gia hạn.

### API trạng thái, phân quyền và tình huống cần xử lý

- `GET /api/v1/partner-token/status` — chỉ role Admin đã xác thực Firebase, không trả access/refresh token.
- `POST /api/v1/partner-token/refresh` — chỉ role Admin, chạy gia hạn ngay để xử lý sự cố, không cần để vận hành tự động.
- Nếu trạng thái `retry_scheduled`: kiểm tra mạng, quota, cấu hình/tình trạng TikTok và đợi job chạy lại. Trạng thái `reauthorization_required`: refresh token hết hạn hoặc tài khoản/loại token thay đổi; làm lại OAuth.
- Đảm bảo bật scope Partner cần thiết. Gia hạn token **không tự cấp thêm quyền** Affiliate hoặc quyền LIVE của tài khoản khác.
- Bảo vệ cron và D1; không tạo endpoint public xem token, không ghi URL refresh (URL chứa App Secret) vào log. Đừng cấp role Admin tràn lan.
- D1/Worker miễn phí có quota, hiệu năng và hạn mức Cron phụ thuộc gói Cloudflare; cần kiểm tra console khi triển khai thật. Đây là mã nguồn đã thiết kế và kiểm thử bằng mock, **chưa gia hạn tài khoản TikTok của bạn thật**.

Tài liệu: https://partner.tiktokshop.com/docv2/page/678e3a362dccb8030ea6f98c · https://partner.us.tiktokshop.com/docv2/page/create-your-app
