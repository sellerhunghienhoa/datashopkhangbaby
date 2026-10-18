# V82 – Xử lý quyền Admin đúng nguồn D1

## Sửa đổi
- Frontend luôn truy vấn `/api/v1/me` bằng Firebase ID token đã làm mới, kiểm tra UID trùng Firebase hiện tại.
- Làm mới quyền sau đăng nhập và khi quay lại tab, cập nhật giao diện nếu role đã thay đổi.
- Chế độ production không giả lập vai trò người khác; sign-out loại bỏ vai trò Admin cũ.
- Server chỉ lấy quyền trong D1 qua UID; tuyệt đối không tự gán Admin dựa trên địa chỉ email.
- `/api/v1/me` trả email phiên Firebase để chẩn đoán sai tài khoản.

## Quan trọng khi cập nhật website đang chạy
- Bản ZIP có cấu hình Firebase/Worker trống theo thiết kế; **sao chép nguyên `public/js/runtime-config.js` từ source V81 đang chạy ở Cloud Shell trước khi deploy**.
- Cập nhật mã mới rồi deploy Firebase Hosting. Worker chỉ cần deploy nếu muốn endpoint `/me` thêm trường email; thay đổi này không bắt buộc cho kiểm tra UID.
- Không chạy migrations. Không đổi D1 role nếu chưa xác minh UID trong Firebase Console.

## Nếu vẫn thấy Viewer
- Xem `/api/v1/me` Response (không gửi Authorization header). Nếu trả Viewer thì UID của phiên hiện tại đang được D1 nhận là Viewer; kiểm tra đối chiếu UID giữa Firebase Authentication và D1.
- Nếu trả Admin nhưng UI Viewer, tải mới website và kiểm tra lỗi JavaScript console. Bản V82 render lại ngay khi role thay đổi.

## Cấp quyền owner lần đầu (không tự cấp theo email)
Chỉ người quản lý Cloudflare D1 được thao tác. Xem trước đúng UID và email; chạy UPDATE có điều kiện đồng thời với UID + email, role Viewer và active=1. Không chạy nếu UID chưa được đối chiếu với Firebase Authentication.
