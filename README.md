# DATA SHOPKHANGBABY — V81 Production

Bản V80 không dữ liệu demo, bổ sung:

- Tự gia hạn access token **Partner Center** (mặc định 15 phút kiểm tra; làm mới khi còn dưới 30 phút) vốn có từ V80.
- **Mới:** tự gia hạn token Seller OAuth cho hai kênh chính thức độc lập, mã hóa AES-GCM trong Cloudflare D1; tự dùng refresh token xoay vòng do TikTok trả về.
- **Mới:** Cron thử lấy TikTok Shop LIVE Performance với chữ ký HMAC-SHA256, chỉ ghi số thật đã kiểm tra định danh, schema và VND. Không tự ghi doanh thu giả.
- **Chưa hoàn chỉnh để chạy thật ngay**: quyền TikTok Analytics, shop_cipher, token Seller và xác nhận schema LIVE phải được cung cấp/kiểm thử bằng tài khoản thật; Order/Refund adapter chưa xây dựng.

Đọc hướng dẫn triển khai chi tiết tại `docs/V81_AUTO_SYNC_AND_TOKEN.md`, sau đó mới chạy `wrangler deploy`.

**Bảo mật:** tuyệt đối không đưa App Secret, refresh/access token hoặc key mã hóa lên frontend/Git/chat.

Xem `docs/V82_ADMIN_ROLE_FIX.md` cho thay đổi Admin/Viewer và triển khai an toàn.
