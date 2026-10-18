# Triển khai V79 lên Firebase & Cloudflare

1. Deploy thư mục `public` lên Firebase Hosting (theo `firebase.json`).
2. Bật Firebase Auth Email/Password, Google và domain ủy quyền.
3. Triển khai Worker trong `cloudflare/` và liên kết Cloudflare D1.
4. Cấu hình đúng Secrets (không đẩy secret vào ZIP public).
5. Với D1 mới: dùng migrations có trong ZIP. Với D1 đã sử dụng: **không chạy lại `0001_initial.sql`**, giữ bảng migration có sẵn và sao lưu trước.
6. Chỉ ingest Seller/Orders theo `cloudflare/scripts/ingest.mjs`.
7. Bản HTML demo chạy không cần deploy, nhưng mọi số MB là mô phỏng và chưa kết nối nguồn dữ liệu thật.

Chi tiết xóa tính năng và các bảng cũ: `docs/V79_SCOPE_AND_STORAGE.md`.
