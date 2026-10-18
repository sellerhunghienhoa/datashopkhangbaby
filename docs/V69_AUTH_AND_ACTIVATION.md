# V69 — Firebase Authentication & duyệt mã tài khoản

## Chạy thật (bắt buộc trước khi triển khai)

1. Bật **Authentication > Sign-in method > Email/Password và Google** trong Firebase Console. Cấu hình mẫu email khôi phục/địa chỉ gửi, tên miền được ủy quyền và chính sách chống lạm dụng; triển khai Firebase Hosting qua HTTPS.
2. Triển khai Cloudflare Worker theo `cloudflare/`, cấu hình `FIREBASE_PROJECT_ID`, `FRONTEND_ORIGIN`, D1 binding `DB`, và `public/js/runtime-config.js` với `mode:'live'`, `apiBaseUrl`, Firebase client config. **Không lưu Firebase Admin key, TikTok secret hoặc mật khẩu trong JavaScript.**
3. Chạy migration `0005_account_activation.sql` qua Wrangler (xem `cloudflare/package.json`, lệnh `npm run migrate:remote`). Sao lưu D1 trước khi migrate production.
4. **Bootstrap quản trị viên lần đầu bằng kênh quản trị tin cậy:** đăng ký tài khoản quản trị qua Firebase -> xác thực UID và email trực tiếp trong Firebase Console -> sau khi tài khoản đã được tạo trong `app_users` bằng `/api/v1/registration`, chạy cập nhật D1 từ Cloud Shell: `wrangler d1 execute shopkhangbaby_db --remote --command "UPDATE app_users SET role='Admin' WHERE firebase_uid='<UID_DA_XAC_MINH>';"`. Thực hiện duy nhất khi đã kiểm tra UID/email, không công khai hay sử dụng đầu vào của trình duyệt cho thao tác này.
5. Người mới đăng ký với email/mật khẩu hoặc Google: Firebase tạo/tái xác thực tài khoản. Worker đăng ký lần đầu với `role='Viewer'`, `active=1` và tạo mã `KB-...` ngẫu nhiên 160-bit **chỉ hiển thị một lần**, có hiệu lực 7 ngày. Chỉ SHA-256 của mã được lưu trong D1.
6. Người dùng gửi riêng mã đó cho Admin. Admin vào **Phân quyền → Kích hoạt tài khoản mới** để xem người đang chờ, nhập mã, chọn `Viewer / Host / Ops` và duyệt. Mã chỉ dùng một lần. Không có cách tự cấp quyền Admin qua mã. Người dùng tải lại trang để làm mới quyền.
7. Người dùng quên mật khẩu có thể xin liên kết đặt lại qua Firebase, không đi qua Cloudflare D1. Trước khi Admin duyệt mã: người đăng ký email/mật khẩu phải xác minh email từ liên kết Firebase và tải lại trang để cập nhật trạng thái. Nếu mất mã kích hoạt: trong hồ sơ Viewer có nút cấp lại, chờ ít nhất 5 phút kể từ lần cấp trước.

## Trạng thái và giới hạn

- Quyền `Viewer` hiện giới hạn API backend: chỉ đọc LIVE chính thức. `Affiliate` và `Ads` yêu cầu `Ops/Admin`; API sync/Partner yêu cầu quyền tương ứng. Kiểm tra quyền ở Worker, không dựa vào UI.
- Phần **phân quyền chi tiết từ phiên bản cũ** (checkbox các module theo từng nhân viên, thêm/xóa user demo) chưa kết nối vào DB Live. Bản V69 chỉ có duyệt và phân cấp **vai trò** thực ở backend; không coi chức năng demo là phân quyền production.
- Worker bắt buộc `email_verified=true` trước khi Admin nâng quyền; người dùng cần xác minh địa chỉ email trước khi gửi yêu cầu duyệt. Tài khoản mới chưa xác minh vẫn ở vai trò Viewer mặc định. Cần bổ sung rate limit/Turnstile và giám sát signup trước khi mở công khai để tránh lạm dụng tài nguyên Free.
- Các mật khẩu chỉ được Firebase Authentication xử lý. Không ghi hoặc chia sẻ token kích hoạt trong CSV, log hoặc URL. `APP Secret`/`ACCESS TOKEN` TikTok tuyệt đối không lưu ở frontend.
- Mã demo `DEMO-KB-...` chỉ mô phỏng trong `sessionStorage`, **không kích hoạt người dùng Firebase**. Nút “Xem thử vai trò quản trị (Demo)” chỉ tồn tại trong mode `demo`.
- Khi được phê duyệt, quyền Live cập nhật sau lần đăng nhập/tải lại. Việc thu hồi phiên hiện hữu hoặc quyền nhạy cảm cần xác minh qua Worker tại mỗi lần gọi API.
