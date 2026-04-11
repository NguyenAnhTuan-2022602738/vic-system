# 💡 BRIEF: Nâng cấp VIC Pipeline Dự báo T+2

**Ngày tạo:** 2026-04-01
**Brainstorm cùng:** Antigravity AI Partner
**Trạng thái:** Hoàn thiện yêu cầu hệ thống theo đúng workflow /brainstorm

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT (Pain points hiện tại)
- **Thiếu nhất quán dữ liệu:** Mỗi lần người dùng F5 hoặc về trang tổng quan, các con số dự báo lại nhảy loạn xạ (do cơ chế sinh số ngẫu nhiên Monte Carlo và dữ liệu fake/synthetic).
- **Thiếu thực tế:** Mô hình hiện tại lấy dữ liệu tĩnh từ CSV cũ. Không cập nhật dữ liệu ngày hôm trước.
- **Không phù hợp chứng khoán VN:** Ở Việt Nam áp dụng cơ chế T+2.5, trader mua xong phải chờ gần 3 ngày mới được bán, nên dự báo 1 ngày là vô nghĩa.

## 2. GIẢI PHÁP ĐỀ XUẤT (Giải quyết Triệt để)
Chuyển hệ thống từ **"Dự báo theo thời gian thực (Stateless)"** sang **"Lưu trữ và Cập nhật chủ động (Stateful/Pipeline)"**:
1. Dự báo được tập trung tối ưu cho **khung thời gian 3 NGÀY** (Cho phép User HOLD và xả hàng theo T+2.5).
2. Xây dựng **quy trình Cập nhật & Dự đoán theo Nút bấm (Trigger Pipeline)** thay vì tính toán lại từ đầu mỗi lần load trang.
3. Khi load trang, Frontend chỉ việc "Đọc kết quả" đã được AI lưu ở lần chạy gần nhất => Nhanh, mượt, và kết quả luôn cố định/tin cậy.

## 3. TÍNH NĂNG MỚI YÊU CẦU (The "Refresh & Predict" Flow)

### 🚀 MVP (Bắt buộc có):
- [ ] **Nút "Cập nhật dữ liệu & Dự báo":** Nằm trên Header hoặc phần Forecast.
- [ ] **Logic Cập nhật Giá (Price T-1):** Khi ấn nút ở ngày hiện tại (Ví dụ: Ngày 25), hệ thống sẽ check file `vic_features.csv` xem đã có dữ liệu đóng cửa của ngày hôm trước (Ngày 24) chưa. Tứ là ngày gần nhất phải có dữ liệu trong file.
  - Nếu CÓ: Không làm gì cả để tiết kiệm tải.
  - Nếu CHƯA: Auto crawl dữ liệu từ ngày cuối cùng trong CSV đến hết "Ngày 24" -> Ghi nối dòng vào CSV để làm đầy dữ liệu.
- [ ] **Logic Cập nhật Tin Tức (News):** Crawl tin tức của hôm nay & hôm qua -> Chạy Sentiment Scoring luôn -> Lưu tin và điểm cảm xúc vào Database (MongoDB hiện có).
- [ ] **Logic Dự báo 3 Ngày (Predict):** Lấy đúng 60 thanh nến thực tế gần nhất -> Chạy qua con LSTM đã train -> Gộp với Sentiment Score mới nhất -> Ra quyết định MUA/BÁN.
- [ ] **Lưu lịch sử Dự báo (Forecast History):** Lưu cục kết quả cuối cùng này vào Database (vd: Bảng `ForecastResult`).
- [ ] **Tối ưu Load Dashboard:** Sửa API `/forecast/overview`, chỉ `SELECT * FROM ForecastResult ORDER BY time DESC LIMIT 1` trả về luôn, ngưng tính toán tại chỗ.

## 4. ƯỚC TÍNH SƠ BỘ & ĐÁNH GIÁ KỸ THUẬT (Reality Check)
- **Độ phức tạp:** 🟡 **TRUNG BÌNH (Medium)**
- **Rủi ro/Lưu ý:** 
  - Về mô hình LSTM: Anh nói đúng, LSTM train 1 lần (cố định trọng số weights), ta chỉ việc đẩy bộ 60 ngày data mới (Input) vào hàm `model.predict()` là nó nhả ra xu hướng 3 ngày tới (Output). Rất dễ và chuẩn bài học máy!
  - Cần chuyển đổi cơ chế đọc CSV thuần túy sang kết hợp MongoDB cho phần lịch sử dự báo để dễ truy xuất lại.

## 5. BƯỚC TIẾP THEO
→ Gọi `/plan` để Antigravity lên kế hoạch thiết kế Database Model và API Endpoint cho quy trình này.
