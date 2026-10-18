# DATA SHOPKHANGBABY — V79

Bảng điều khiển LIVE chính thức, đối soát, KPI Host, phân quyền và bộ nhớ.

## Đã gỡ

Các tab Top nhà sáng tạo, LIVE Affiliate, Phân tích quảng cáo; cùng API/ingest chuyên biệt và dữ liệu mẫu của chúng.

## Còn lại

- Tổng quan hệ thống, phiên LIVE hai kênh, đối soát, KPI Host & vận hành
- Phân quyền / kích hoạt tài khoản
- Kết nối TikTok Shop Seller + Partner token khi cần, Firebase / Cloudflare
- Tự động dọn dẹp **trước** dung lượng (cả ba nguồn trong **một khung**)

## Xem nhanh

Dùng `DATA_SHOPKHANGBABY_DEMO_V79.html` (nằm cùng thư mục với ZIP), mở trực tiếp trình duyệt. Demo không cập nhật Firebase/D1 thật.

## Triển khai

Mã nguồn triển khai nằm trong `public`, `cloudflare`, `docs`. Xem `docs/DEPLOY.md` và `docs/V79_SCOPE_AND_STORAGE.md` trước khi nâng cấp D1.

**Quan trọng:** Không thực hiện DROP bảng legacy trên DB production mà chưa sao lưu và phê duyệt.
