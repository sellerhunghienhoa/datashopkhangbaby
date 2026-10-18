# V47 — Thiết kế đối soát hoa hồng LIVE Affiliate theo SKU

**Hiện trạng:** UI chỉ demo localStorage, không truy xuất dữ liệu thật. Cloudflare migration là lược đồ dự kiến; chưa có job import đơn và sự kiện thanh toán TikTok.

## Quy tắc

- Định danh **Shop ID/Shop Cipher – Order ID – Order Item ID – SKU ID – Creator ID – LIVE ID (nếu TikTok cung cấp)**. Không áp tỷ lệ theo cả phiên, và không cộng lại GMV Affiliate vào doanh thu chính thức.
- Một **đơn có thể có nhiều dòng SKU**; doanh thu đủ điều kiện phải phân bổ chính xác theo từng dòng đơn sau voucher, giảm giá, thuế theo số liệu TikTok. Không lấy giá niêm yết hay GMV LIVE làm cơ sở.
- Mỗi dòng đơn lưu **rate_snapshot_bps** và **rate_version_id** từ điều kiện hưởng hoa hồng tại thời điểm giao dịch. Chỉ dùng tỷ lệ vừa sửa cho đơn *mới*; lưu cả nguồn `standard`, `shop_ads`, `target` nếu được cấp dữ liệu.
- `estimated = ROUND(paid_eligible_vnd × rate_bps/10000)`; `adjusted = ROUND(MAX(0,paid_eligible_vnd-cumulative_refund_vnd) × rate_bps/10000)`. Đơn hủy/hoàn toàn bộ đủ điều kiện = 0. Tiền VND là số nguyên; đối soát quy tắc làm tròn với báo cáo chính thức TikTok.
- Tách rõ: **ước tính trước hoàn**, **tạm tính sau hoàn**, **hoa hồng TikTok quyết toán**, **chênh lệch**. Không coi tiền dự báo là tiền đã trả.
- Chỉ đánh dấu **khớp** nếu có số liệu official và sai lệch <= ngưỡng được cấu hình (demo dùng 1đ). Nếu chưa có bản quyết toán: **chờ**. Nếu lệch: lưu lỗi, nguồn, thời điểm, lịch sử chỉnh sửa và không tự ghi đè báo cáo TikTok.
- Với nhiều sự kiện hoàn/hủy, **upsert theo event_id**, tính tổng hoàn theo từng order_item_id và cập nhật cả khi đã qua thời gian giao hàng; không tự khóa dữ liệu sau 15 ngày. Sau khi hoàn tất chính sách hậu mãi, quyết toán dựa trên trạng thái TikTok.
- Không tự cộng lẫn **Affiliate Creator, Affiliate Partner, platform fee, phí thanh toán hoặc hoa hồng Shop Ads**. Phải phân tách loại phí khi nguồn trả về.

## Pipeline Cloudflare Worker/D1 (cần triển khai sau OAuth)

1. Cron lấy dữ liệu shop, Affiliate orders/order items/settlements được tài khoản cấp phép từ Seller/Partner API; nếu API không trả dữ liệu ở cấp SKU hoặc mức hoa hồng, yêu cầu báo cáo chính thức phù hợp; không tự bịa tỷ lệ.
2. Chuẩn hóa `currency=VND`, timezone +07:00, SKU, Creator ID, source attribution, version tỷ lệ; chặn dữ liệu trùng bằng order_item_id/event_id/settlement_id và mốc `source_updated_at`.
3. Ghi đơn hàng, refund events, settlement events bằng transaction và audit; tính lại phần chưa hoàn/đã hoàn nhưng không sửa `rate_snapshot_bps` lịch sử.
4. So sánh với số TikTok xác nhận; cảnh báo nếu lệch hoặc không thể xác định SKU/rate/nguồn; chỉ người được quyền đối soát mới có thể ghi chú hay xác nhận thủ công.
5. Báo cáo tổng theo phiên và creator lấy từ **order items đã quy gán đủ điều kiện**; đừng lấy hoa hồng LIVE bằng `GMV phiên × 1 tỷ lệ`.
6. Bảo vệ REST API bằng Firebase ID token thật + RBAC phía Worker; không cho ghi tài chính từ UI demo hoặc localStorage khi production.

## Kiểm thử

`node tests/affiliate-commission.test.cjs` kiểm tra: SKU khác tỷ lệ, snapshot lịch sử, thay đổi tỷ lệ không sửa đơn cũ, hoàn một phần, hủy đủ, đối soát khớp/lệch và doanh thu mẫu không sai số.

**Tài liệu TikTok (Việt Nam):**
- https://seller-vn.tiktok.com/university/essay?knowledge_id=6837840205842177
- https://seller-vn.tiktok.com/university/essay?knowledge_id=7904880287155985
- https://ads.tiktok.com/resources/help/article/about-setting-different-affiliate-commission-rates-for-tiktok-shop-ads

Demo có nhật ký thay đổi localStorage để thử giao diện; **đây không phải audit bất biến** và không thay thế D1 audit phía server với quyền thực.
