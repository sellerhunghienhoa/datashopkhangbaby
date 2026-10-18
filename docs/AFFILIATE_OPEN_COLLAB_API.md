# TikTok Open Collaboration — nguồn tỷ lệ chính thức (V49)

**V49 KHÔNG tính hoa hồng từ tỷ lệ nhập tay.** Tab LIVE Affiliate chỉ hiển thị doanh thu, đơn hàng, hoàn/hủy, nhà sáng tạo. Không có dữ liệu API TikTok thật nên không hiện bất kỳ giá trị hoa hồng minh họa nào.

## Khi kết nối TikTok thật

1. App TikTok Shop được phê duyệt quyền `seller.affiliate_collaboration.read` (Read Seller Affiliate Collaborations) và Seller cấp OAuth (seller access token + Shop Cipher) cho shop sở hữu sản phẩm.
2. Backend Cloudflare Worker (không phải frontend) gọi **Search Open Collaborations (202412)**: `POST /affiliate_seller/202412/open_collaborations/search` để đọc danh sách Cộng tác mở và thông tin commission *hiện tại* theo product. Hoặc **Seller Search Open Collaboration Products (202405)**: `POST /affiliate_seller/202405/open_collaborations/products/search`. Hai API cần chữ ký TikTok, app_key, timestamp, shop_cipher, x-tts-access-token, phân trang.
3. Đồng bộ product_id/open_collaboration_id, tỷ lệ, dấu thời gian lấy dữ liệu, shop_id; không ghi đè dữ liệu lịch sử đã xác nhận. Chỉ hiển thị phần tỷ lệ sau khi API thành công.
4. Để xác định **hoa hồng/chi phí thực tế của đơn**, phải đọc dữ liệu đơn Affiliate + hoàn trả và chứng từ tài chính. Tham khảo **Get Transactions by Order (202501)** `GET /finance/202501/orders/{order_id}/statement_transactions` yêu cầu `seller.finance.info`, cho chi tiết khoản phí, commission, refunds ở SKU-level.
5. Chỉ hiện hoa hồng quyết toán khi có dữ liệu tài chính/settlement chính thức khớp Order ID/SKU. **Không lấy tỷ lệ Cộng tác mở hiện tại nhân GMV của phiên để thay cho hoa hồng đã quyết toán.** Các mức Target Collaboration, Ads commission, lịch sử thay đổi có thể khác tỷ lệ Cộng tác mở hiện hành.
6. Nếu thiếu quyền/API hoặc TikTok lỗi: hiển thị “Chưa đồng bộ”, không cho sửa tỷ lệ bằng tay; cảnh báo quản trị viên và giữ số liệu được xác minh lần cuối (nếu có) với thời gian cập nhật.

Tài liệu TikTok chính thức:
- https://partner.tiktokshop.com/docv2/page/search-open-collaborations-202412
- https://partner.tiktokshop.com/docv2/page/seller-search-open-collaboration-products-202405
- https://partner.tiktokshop.com/docv2/page/get-transactions-by-order
- https://partner.tiktokshop.com/docv2/page/affiliate-integration

**Trạng thái:** Đây là hướng tích hợp, V49 chưa gọi các endpoint này vì chưa có quyền/tài khoản OAuth thật. Cần kiểm tra phản hồi và mapping field theo phiên bản được phê duyệt trước khi chạy production.
