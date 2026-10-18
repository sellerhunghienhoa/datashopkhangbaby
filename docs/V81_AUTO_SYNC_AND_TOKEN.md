# V81: Gia hạn token tự động & đồng bộ TikTok Shop

## Phạm vi

1. **Partner Center**: giữ bộ tự gia hạn `partner_oauth_tokens` từ V80, AES-256-GCM, khóa D1 lease và Cron `*/15 * * * *`. Tự gia hạn khi access token còn <= 30 phút. Khi refresh_token hết hạn/bị thu hồi, phải cấp quyền lại; không có API nào có thể tự ý kéo dài quyền người dùng đã thu hồi.
2. **Seller**: thêm 2 bản ghi token độc lập, một cho `shopkhangbaby`, một cho `mekhangsua`; gia hạn tự động trước hạn 30 phút, lưu token đã thay đổi vào D1 mã hóa.
3. **LIVE**: Cron kiểm tra token và truy vấn `GET /analytics/202509/shop_lives/performance` qua TikTok Shop Open API (nếu có quyền `data.shop_analytics.public.read`). Tự nhập LIVE vào D1 *chỉ khi* xác minh đủ trường LIVE ID, handle trùng hai kênh, ngày, VND, items. Nếu response schema khác hay thiếu quyền, báo lỗi và không tạo dữ liệu giả.
4. **Orders/Refund**: chưa tự kéo orders/refunds. Các endpoint import orders đã có từ V80 vẫn nhận dữ liệu từ adapter đáng tin cậy/Cloud Shell. Không lấy GMV còn thiếu để bù dữ liệu.

## Thiết lập thật

- Ở TikTok Partner Center, tạo/đăng ký ứng dụng và cấp quyền Seller OAuth riêng cho shop có hai kênh chính thức. **Partner token user_type 2/3 không thay thế Seller token user_type 0**. Hai authorization có thể thuộc chung một shop, nhưng cần xác minh mapping theo TikTok ID, không chỉ nickname.
- Đảm bảo TikTok cấp đúng scope `data.shop_analytics.public.read` và quyền sử dụng `GET /analytics/202509/shop_lives/performance` tại thị trường của shop.
- Chạy migration `0006_seller_oauth_rotation.sql` theo thứ tự Wrangler; **sao lưu D1 trước khi chạy migration remote**.
- Thiết lập với `npx wrangler secret put <TEN_BIEN>` trong thư mục `cloudflare`:
  - `PARTNER_APP_KEY`, `PARTNER_APP_SECRET`, `PARTNER_INITIAL_REFRESH_TOKEN`, `PARTNER_TOKEN_ENCRYPTION_KEY` (base64 key 32 bytes) — dùng chung cơ chế mã hóa đã có.
  - `SELLER_APP_KEY`, `SELLER_APP_SECRET`.
  - `SELLER_REFRESH_TOKENS_JSON`: JSON đúng `{"shopkhangbaby":"<REFRESH_TOKEN_1>","mekhangsua":"<REFRESH_TOKEN_2>"}`; tạo thông qua Seller OAuth cấp quyền chính thức. Không gửi giá trị vào chat hay Git.
  - `SELLER_SHOP_CIPHER_SHOPKHANGBABY`, `SELLER_SHOP_CIPHER_MEKHANGSUA`: shop_cipher lấy từ TikTok sau ủy quyền (có thể là một cipher dùng chung nếu hai account thật sự thuộc một shop).
  - `SELLER_SHOP_TIMEZONE`: nếu không khai báo, dùng `Asia/Ho_Chi_Minh`.
- Kiểm tra `FIREBASE_PROJECT_ID`, `FRONTEND_ORIGIN`, D1 binding, `SYNC_INGEST_KEY`. Triển khai `npx wrangler deploy`.
- Xác thực Admin trên Firebase rồi gọi `GET /api/v1/seller-token/status` và `GET /api/v1/partner-token/status`. Chỉ status an toàn được trả về, không chứa token.
- Bảo đảm cron đã được deploy: `[triggers] crons=["*/15 * * * *"]`.

## Điều kiện cần đối chiếu khi kết nối thật

- TikTok response của LIVE performance có thể thay đổi schema theo phiên bản/quyền. Chỉ khi có response từ ứng dụng thực mới xác minh đầy đủ dữ liệu phiên, gắn kênh và tính GMV/hoàn-hủy chính xác. **Không nên coi V81 là đã đồng bộ thành công** nếu chưa có API authorization thật.
- Dữ liệu gross GMV của TikTok Shop Analytics không đồng nghĩa doanh thu đã đối soát cuối cùng. Refunds/cancels cần Order APIs.
- Cron tối đa 5 trang x 100 bản ghi mỗi kênh mỗi đợt (giới hạn gói Cloudflare miễn phí); không ghi số liệu ước lượng nếu quá giới hạn, trả trạng thái partial.
- Token có thể bị thu hồi; app secret/scope có thể bị đổi; khi đó cần cấp quyền Seller/Partner lại. Gia hạn access token không gia hạn vô hạn refresh token.

Tài liệu TikTok tham khảo: https://partner.tiktokshop.com/docv2/page/get-shop-live-performance-list-202509 và https://partner.us.tiktokshop.com/docv2/page/create-your-app.
