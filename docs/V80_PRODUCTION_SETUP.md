# V80 Production — CẤU HÌNH BẮT BUỘC

1. Firebase: tạo dự án thật, bật Email/Password và Google, thêm domain Firebase Hosting, điền 4 thông số Firebase public config trong `public/js/runtime-config.js`.
2. Cloudflare: tạo D1, Worker, chạy migration trên DB mới hoặc nâng cấp thận trọng DB cũ; cấu hình `FIREBASE_PROJECT_ID`, `FRONTEND_ORIGIN`, `SYNC_INGEST_KEY` (Secret), `DB` binding.
3. Triển khai Worker và điền `apiBaseUrl` với origin đầy đủ. Tuyệt đối không lưu App Secret hoặc refresh token ở public.
4. Cấp quyền quản trị khởi tạo **bằng thao tác quản trị trên D1 đã xác minh UID Firebase**; không để trình duyệt tự nâng quyền. Sao lưu DB trước.
5. TikTok Shop: kết nối OAuth ứng dụng có quyền truy cập LIVE/Orders/Refunds của hai shop. Backend hiện mới có API ingestion dữ liệu chuẩn hóa (`/api/v1/ingest/seller`, `/api/v1/ingest/orders`), **chưa có adapter tự lấy dữ liệu TikTok**. Bạn có thể nhập dữ liệu thật bằng Cloud Shell với khóa ingest sau khi xác minh mapping và phạm vi quyền. Tự động đồng bộ đòi hỏi bổ sung adapter và cron.
6. Chưa có API quản lý thành viên (đổi vai trò) hoặc số đo quota Firestore/D1/R2 thực tế: giao diện hiển thị chưa thiết lập, không giả lập. Cleanup không hoạt động cho đến khi có Worker Cron và quy tắc xóa an toàn.
7. Chạy `npm test` ở `cloudflare` và test trên trình duyệt thực tế; demo account và số liệu lịch sử giả đã bị vô hiệu hóa.

**Trạng thái:** gói chuẩn bị triển khai, không đồng nghĩa đã có kết nối TikTok hay đang chạy trên internet.
