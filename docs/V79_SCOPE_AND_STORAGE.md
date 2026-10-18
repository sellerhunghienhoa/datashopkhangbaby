# V79 – phạm vi đã thu gọn và quản lý bộ nhớ

- Giữ: Tổng quan, phiên LIVE chính thức của `mekhangsua` và `shopkhangbaby`, đối soát, KPI Host, phân quyền, kết nối Seller/Partner OAuth phục vụ Seller, bộ nhớ.
- Đã xóa khỏi ứng dụng: xếp hạng creator, LIVE Affiliate, TikTok Ads; các endpoint `GET /api/v1/affiliate-sessions`, `GET /api/v1/ads-campaigns`, `POST /api/v1/ingest/affiliate`, `POST /api/v1/ingest/ads`; bộ đọc cùng tab giao diện.
- Dữ liệu mẫu và chức năng demo của những tính năng đã gỡ không còn trong source code hoạt động.
- Bộ nhớ: cấu hình tự động dọn dẹp ở trên; một khung dùng chung hiển thị Firebase Firestore, D1, R2; các giá trị MB **chỉ mô phỏng**, không phải dung lượng thật.
- Lưu ý D1 đã triển khai: phiên bản này **không tự động DROP** bảng `affiliate_sessions`, `ads_campaigns` hoặc các bảng hoa hồng cũ. Không xóa dữ liệu tồn tại trước khi sao lưu và có phê duyệt. Đối với DB mới, migration được tối giản. Nếu đã triển khai các migration V78, hãy giữ nhật ký migration D1 và tham khảo cách làm migration nâng cấp an toàn thay vì chạy lại toàn bộ từ đầu.
- Không xóa Seller OAuth hoặc Partner Center token refresh nếu hệ thống hiện tại cần để truy cập API LIVE Seller.
