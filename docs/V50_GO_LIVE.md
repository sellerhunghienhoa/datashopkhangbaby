# DATA SHOPKHANGBABY – Checklist live V79

- Triển khai Firebase Authentication và email/password/Google OAuth với domain được cấp phép.
- Triển khai Cloudflare Worker kết nối D1, chạy migrations đã được kiểm tra theo phiên bản DB hiện có.
- Cấp bí mật `SYNC_INGEST_KEY`, chỉ nhập phiên LIVE chính thức của `shopkhangbaby`, `mekhangsua` và các đơn hàng gắn kênh.
- Đồng bộ OAuth Seller/Partner theo quyền được cấp; kiểm tra gia hạn token và xác thực quyền Admin ở backend.
- Không dùng dung lượng demo trong mục Dọn dẹp làm dung lượng thực của Firebase/D1/R2.
- Sao lưu D1 trước khi nâng cấp schema; không tự xóa bảng legacy.
- Thử kỹ đăng nhập, phân quyền, đối soát trên thiết bị thật trước khi cho nhân sự sử dụng.
