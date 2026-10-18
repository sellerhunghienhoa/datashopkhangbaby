# DATA SHOPKHANGBABY – Phạm vi API V79

**Mục tiêu:** hai tài khoản TikTok LIVE chính thức `shopkhangbaby` và `mekhangsua`, đơn hàng/hoàn-hủy, KPI Host.

## TikTok Shop Seller

1. Đăng ký TikTok Shop ứng dụng, cấu hình OAuth callback HTTPS và đúng quyền báo cáo LIVE/Orders/Refunds.
2. Nhận ID kênh TikTok được ủy quyền, lưu mapping xác minh với hai username chính thức.
3. Đặt `app_key`, `app_secret`, refresh token trên Cloudflare Worker/Secrets, **không** lưu trong trang HTML.
4. Worker chỉ nhận bản ghi được chuẩn hóa qua `POST /api/v1/ingest/seller` và `POST /api/v1/ingest/orders`; idempotent theo session/order ID.
5. `GET /api/v1/live-sessions` và `GET /api/v1/sync/status` xác thực Firebase.

## TikTok Shop Partner Center

Partner Center được giữ để quản lý ứng dụng TikTok Shop và cơ chế cấp/gia hạn token có thể phục vụ Seller. Chỉ cần những quyền thực sự được TikTok phê duyệt. Không mặc định có quyền xem dữ liệu ngoài hai kênh.

## Đã gỡ khỏi V79

Không còn nguồn ingest, endpoint hoặc giao diện riêng cho quảng cáo TikTok hay LIVE của đối tác bán hàng. Các bảng lịch sử cũ trên DB production không bị tự động xóa.
