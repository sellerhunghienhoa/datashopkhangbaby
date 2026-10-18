
## Cập nhật V52

- Fix triệt để giao diện **màn hình đăng nhập trên điện thoại** để nền trên đỉnh trang, vùng giữa và sát chân trình duyệt liền mạch hơn.
- Giảm cảm giác khối đăng nhập bị “lọt thỏm” giữa màn hình bằng cách cân lại vị trí card, khoảng đệm safe-area và nền gradient.
- Bổ sung `theme-color` cho trình duyệt mobile để màu thanh trên cùng hòa với giao diện tím pastel.

# DATA SHOPKHANGBABY — V50: Cấu hình một lần, Cloudflare D1 tự cấp dữ liệu cho web

Bản V50 bổ sung **pipeline backend chống trùng** và **chế độ Live riêng**. Mọi thông tin TikTok API phải được cấp ở Cloudflare/backend, không nhập lại trong frontend.

**Quan trọng:** V50 triển khai được việc lấy **dữ liệu thật đã nhập vào D1** qua Firebase Authentication. V50 **chưa tự gọi TikTok Seller/Ads** vì cần OAuth, quyền API và connector chuẩn hóa dữ liệu. Cloudflare Cron đang tự kiểm tra Partner Token, chưa tự thu thập LIVE/Ads.

## Đã thêm

- Cloudflare `POST /api/v1/ingest/{seller|affiliate|ads|orders}` chỉ cho backend/Cloud Shell có secret.
- Upsert theo Session ID, Order ID và Advertiser + Campaign + Report Date; batch key chặn nhập lặp.
- Migrations `0004_sync_pipeline.sql` thêm nhật ký và trạng thái đồng bộ mà không xóa dữ liệu cũ.
- Firebase Google Login trong `mode:'live'` và xác thực ID token + phân quyền tại Worker.
- Website tự đọc LIVE, Affiliate và Ads từ D1, tải lại khi mở và tự refresh trên trang sau 15 phút.
- Tab Kết nối nguồn dữ liệu hiển thị thời gian nhập, tên nguồn và cảnh báo chưa cấu hình adapter TikTok.
- HTML demo giữ chế độ mô phỏng; dữ liệu thật không bị lẫn với dữ liệu demo.
- Đã test 10 case backend; xác minh SQLite migrations và upsert giữ đúng một hàng khi ghi trùng; smoke test mobile.

**Hướng dẫn triển khai đầy đủ:** [`docs/V50_GO_LIVE.md`](docs/V50_GO_LIVE.md).

---

# DATA SHOPKHANGBABY — Source code tách file

## V49 — LIVE Affiliate không nhập hoa hồng thủ công

- Xóa khỏi giao diện: các ô nhập tỷ lệ SKU, lịch sử tỷ lệ demo, sổ đối soát hoa hồng mẫu và chỉ số hoa hồng tạm tính.
- Bảng Affiliate vẫn hiển thị GMV, GMV sau hoàn/hủy, số đơn, đơn hoàn/hủy, nhà sáng tạo và trạng thái; xuất CSV không còn cột hoa hồng giả định.
- Giữ nguyên các chức năng LIVE chính thức, KPI Host, Ads, phân quyền, màn hình kết nối API và Partner Token Worker.
- Xem `docs/AFFILIATE_OPEN_COLLAB_API.md` để kết nối tỷ lệ **Cộng tác mở** thật khi TikTok cấp scope `seller.affiliate_collaboration.read`. Chưa có API dữ liệu thật nên không hiển thị tỷ lệ/hoa hồng tự động.
- Các migration D1 cũ được giữ lại để không phá lịch sử nâng cấp database; việc bỏ tính hoa hồng thủ công chỉ tác động frontend/demo và không tạo khoản hoa hồng mới ở backend.


Dự án đã **tách từ bản demo V40** thành HTML / CSS / nhiều file JavaScript để dễ chỉnh sửa và đưa lên Firebase Hosting. Bản V42 thiết kế lại tab **Top Nhà sáng tạo / Kênh bán chạy** để dễ đọc trên máy tính và điện thoại, giữ nguyên các chức năng khác, bao gồm bộ lọc, LIVE, Affiliate, Ads, KPI, hồ sơ, phân quyền, đồng bộ và dọn bộ nhớ **mô phỏng**.


## Cập nhật V48

- Vá lỗi **logout trên điện thoại**: khi đăng xuất chỉ còn màn hình đăng nhập, không còn hiện dashboard phía sau.
- Chỉnh lại **nhịp dọc và khoảng cách mobile** để các khối đỡ dính nhau, đều nhau hơn khi xem trên iPhone/Android.
- Dời **toast/thông báo** trên điện thoại lên phía trên để không che bộ lọc và nội dung ở cuối màn hình.
- Giữ nguyên logic dữ liệu demo và phần tính/đối soát hoa hồng Affiliate theo SKU từ V47.

## Thay đổi giao diện V42

- Sắp lại tab **Top Nhà sáng tạo / Kênh bán chạy** thành: giới thiệu ngắn, ba số liệu tổng quan, biểu đồ thanh xếp hạng, hai khu vực nổi bật và bảng chi tiết.
- Bộ lọc xếp hạng có thể chọn **theo GMV sau hoàn hủy hoặc theo số đơn**; hỗ trợ lọc Kênh chính thức / Nhà sáng tạo Affiliate và xuất CSV.
- Trên điện thoại, bảng chi tiết chuyển sang dạng thẻ để không phải kéo ngang quá nhiều.
- Dữ liệu Affiliate có thể trùng với GMV shop, nên hai nguồn **không được cộng gộp** thành một tổng doanh thu.
- Chỉ thay giao diện/demo; chưa thêm kết nối API TikTok thật.

## Cấu trúc

```text
DATA_SHOPKHANGBABY_SOURCE_V42/
├── public/                     # Web tĩnh triển khai lên Firebase Hosting
│   ├── index.html              # Khung HTML
│   ├── assets/favicon.svg
│   ├── css/styles.css          # Be Vietnam Pro + tím pastel
│   └── js/
│       ├── runtime-config.js   # Cấu hình frontend (không chứa secret)
│       ├── data.js             # Dữ liệu mẫu, tên kênh, state
│       ├── dashboard.js        # Bảng LIVE, Affiliate, Ads, KPI
│       ├── accounts.js         # Popup hồ sơ, phân quyền demo
│       ├── storage-demo.js     # Tự dọn bộ nhớ mô phỏng
│       ├── connections-demo.js # Màn hình TikTok API demo
│       ├── ui.js               # Menu, dropdown, tương tác trang
│       └── api-client.js       # Bộ gọi API mẫu, CHƯA được nối vào demo
├── firebase.json               # Firebase Hosting
├── .firebaserc.example         # Mẫu chọn dự án Firebase
├── cloudflare/                 # Worker API + mẫu cơ sở dữ liệu D1
│   ├── src/index.js
│   ├── migrations/0001_initial.sql
│   ├── wrangler.toml.example
│   ├── .dev.vars.example
│   └── package.json
└── docs/DEPLOY.md               # Các bước triển khai
```

## Xem demo trên máy

Mở terminal **trong thư mục `public/`** và chạy:

```bash
python3 -m http.server 8080
```

Sau đó mở `http://localhost:8080`. Không cần npm cho phần frontend tĩnh. **Không nên mở thẳng file://** nếu muốn kiểm tra như môi trường hosting.

## Triển khai Firebase Hosting

Đọc `docs/DEPLOY.md`. Tóm tắt:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting --project YOUR_FIREBASE_PROJECT_ID
```

## Cloudflare

Folder `cloudflare/` là bộ khung API độc lập, có xác thực Firebase ID token và kiểm tra quyền tài khoản ở D1. API chỉ **đọc các bảng đã có dữ liệu**, không tự lấy TikTok. Xem `docs/DEPLOY.md` để tạo D1, bảng, Worker và R2.

## LƯU Ý BẢO MẬT VÀ DỮ LIỆU

- **Đăng nhập Google/Firebase trong demo hiện chỉ là mô phỏng**, chưa phải Firebase Authentication. Phân quyền trên UI/localStorage không bảo vệ backend.
- Các con số LIVE, KPI, quảng cáo, Affiliate, dung lượng, đồng bộ và các hành động xóa đều là **dữ liệu/chức năng demo**, không tự ghi dữ liệu thật.
- **Không nhập API secret, TikTok token hoặc Cloudflare token vào trình duyệt**. Chúng phải được lưu qua `wrangler secret put` hoặc hệ thống bí mật ở backend.
- Để thật sự kết nối phải triển khai Firebase Auth, liên kết quyền người dùng ở D1, TikTok OAuth, quyền API TikTok Shop/Ads/Affiliate, đồng bộ, đối soát sau hoàn/hủy và các kiểm tra bảo mật máy chủ.
- `public/js/api-client.js` đã có hàm gọi API ví dụ, nhưng **chưa được gắn vào dashboard**. Đó là bước tích hợp sau khi backend và tài khoản đã sẵn sàng.
- Font **Be Vietnam Pro** dùng Google Fonts, cần Internet để hiện đúng trên máy chưa có sẵn font.

## Thay đổi V43 — Kết nối dữ liệu

- Tab Kết nối nguồn dữ liệu có **5 nhóm**: TikTok Shop Seller, TikTok Ads, Partner Center, Affiliate, Firebase/Cloudflare.
- Bổ sung các trường App/Service ID, Redirect URI, Scope, Shop Cipher, Category Asset Cipher, nguồn tài khoản và gợi ý API version.
- Có nút kiểm tra các trường tham khảo còn thiếu **không gọi TikTok API**.
- Tài liệu triển khai: [`docs/API_CONNECTIONS.md`](docs/API_CONNECTIONS.md).
- Ô App Secret/Token chỉ là chỉ dẫn, không cho nhập trong demo; OAuth thực và bảo vệ token vẫn cần triển khai qua backend.

## V45 — Gia hạn TikTok Shop Partner token 24/24 (khi triển khai Worker thật)

- Thêm `cloudflare/src/partner-token.js` với TikTok Shop Partner OAuth refresh, xử lý refresh token xoay vòng, AES-GCM mã hóa trong D1 và tự thử lại an toàn.
- Thêm migration `cloudflare/migrations/0002_partner_token_rotation.sql`, Cron mỗi 15 phút, API trạng thái dành riêng Admin và kiểm thử bằng Node.
- Tab Partner Center có thẻ kiểm tra trạng thái; chỉ gọi backend sau khi có Firebase Auth thật.
- Token chỉ được gia hạn khi gần hết hạn (30 phút), căn cứ `access_token_expire_in` thật từ TikTok. Không mặc định mọi token đều có hạn 4 giờ.
- **Chưa thể chạy với tài khoản của bạn chỉ bằng tải ZIP**: cần ủy quyền ban đầu, 4 secrets trong Cloudflare, D1, Firebase Admin và deploy. Không nhập secrets trong HTML.

Xem `docs/API_CONNECTIONS.md` mục 6 cho các bước triển khai. Bộ mã demo vẫn dùng số liệu mô phỏng.


## V45 — Bộ lọc ngày
- Khi bấm **Áp dụng** cho Chọn ngày, nút lọc hiện khoảng ngày đã xác nhận (đầy đủ trong tooltip).
- Menu ngày bỏ cuộn dọc; khi mở lịch, danh sách mốc thời gian thu gọn và có nút quay lại.
- Vẫn giới hạn 3 tháng, áp dụng riêng cho báo cáo chính và LIVE Affiliate.


## V46 — ĐỒNG BỘ NÚT SẮP XẾP GMV

- Tiêu đề doanh thu trong bảng LIVE, LIVE Affiliate, Top Nhà sáng tạo / Kênh và Đối soát sử dụng chung cặp chevron mảnh màu tím; không còn nút đen hình vuông mặc định ở Affiliate.
- Mỗi nút luân phiên giảm dần → tăng dần → bỏ sắp xếp. Việc sắp xếp trong bảng chi tiết Top tách biệt biểu đồ xếp hạng tổng thể.
- CSS nằm trong `public/css/styles.css`, thao tác sắp xếp ở `public/js/dashboard.js`.


## V47 — HOA HỒNG AFFILIATE THEO SKU
- Tab LIVE Affiliate có tỷ lệ riêng cho 5 SKU mẫu, lịch sử phiên bản tỷ lệ, và sổ đối soát dòng đơn: Order ID, SKU, thực trả, hoàn tiền, tỷ lệ lúc bán, hoa hồng dự báo, hoa hồng sau hoàn, hoa hồng do TikTok xác nhận (mô phỏng) và cảnh báo chênh lệch.
- Chỉ Admin / tài khoản được cấp quyền quản lý API mới thay tỷ lệ hoặc điều chỉnh dòng đối soát demo. Thao tác demo được lưu localStorage trên trình duyệt, không sửa dữ liệu nền tảng.
- Khi thay tỷ lệ SKU, các đơn hàng cũ không đổi. Số đã quyết toán chính thức (khi có nguồn TikTok) là giá trị đối chiếu ưu tiên.
- `public/js/affiliate-commission.js` là engine mô phỏng thuần JS; `cloudflare/migrations/0003_affiliate_sku_commissions.sql` là mẫu schema cho backend; `docs/AFFILIATE_SKU_RECONCILIATION.md` mô tả luồng production.
- `node tests/affiliate-commission.test.cjs` để kiểm thử logic.
**Chưa có kết nối TikTok Affiliate Orders/Settlement API thực tế trong V47.** Không dùng số liệu giả lập để quyết toán cho đối tác.


## Thay đổi V51

- Đồng bộ tên hiển thị **ShopKhangBaby** (không có khoảng trắng) tại toàn bộ website và nhãn dữ liệu mẫu.
- Giữ nguyên username/API ID `shopkhangbaby`; không thay đổi định danh dùng để truy xuất hay đồng bộ dữ liệu thật.
