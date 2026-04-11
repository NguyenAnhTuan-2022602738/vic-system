# MÔ TẢ BÀI TOÁN
## VIC Multimodal Conditional Probabilistic Forecasting System

---

## 1. Bối cảnh

Thị trường chứng khoán chịu ảnh hưởng đồng thời bởi nhiều yếu tố:

- Dữ liệu giá lịch sử (price dynamics)
- Hành vi kỹ thuật (technical indicators)
- Tin tức doanh nghiệp và kinh tế vĩ mô
- Tâm lý thị trường

Các phương pháp truyền thống thường:

- Chỉ dựa vào phân tích kỹ thuật
- Hoặc chỉ dựa vào tin tức
- Hoặc chỉ dự đoán theo dạng phân loại (tăng/giảm)

Những cách tiếp cận này không phản ánh đầy đủ:

- Mức độ tăng/giảm cụ thể
- Độ bất định của dự báo
- Rủi ro tail-risk
- Tác động định lượng của tin tức

Do đó, cần một hệ thống dự báo toàn diện hơn.

---

## 2. Vấn đề cần giải quyết

Hệ thống cần có khả năng:

1. Dự báo mức tăng/giảm (%) của cổ phiếu VIC trong X ngày linh hoạt.
2. Biểu diễn dự báo dưới dạng phân phối xác suất thay vì chỉ một giá trị điểm.
3. Tích hợp thông tin tin tức vào dự báo một cách định lượng.
4. Cung cấp thông tin rủi ro như xác suất lỗ và Value-at-Risk (VaR).
5. Học và cải thiện theo thời gian dựa trên kết quả giao dịch thực tế.

---

## 3. Phát biểu bài toán toán học

Cho:

- Chuỗi dữ liệu giá 30 ngày gần nhất.
- Horizon X (số ngày dự báo do người dùng lựa chọn).

Định nghĩa lợi nhuận:

Return(t, X) = (Price(t+X) − Price(t)) / Price(t)

Mục tiêu là xây dựng một hàm:

f(sequence_30d, X) → (μ, σ)

Trong đó:

- μ là lợi nhuận kỳ vọng (expected return)
- σ là độ bất định của dự báo (uncertainty)

Giả định phân phối:

Return ~ N(μ, σ²)

---

## 4. Tích hợp tin tức bằng LLM

Ngoài dữ liệu giá, hệ thống sử dụng tin tức liên quan đến VIC.

Mô hình ngôn ngữ lớn (LLM) phân tích tin tức để tạo ra:

- sentiment_score ∈ [-1, 1]
- impact_weight ∈ [0, 1]

Sau đó điều chỉnh dự báo:

μ_adj = μ × (1 + α × sentiment × impact)

σ_adj = σ × (1 + β × |sentiment| × impact)

Cơ chế này cho phép:

- Tin xấu làm giảm kỳ vọng lợi nhuận
- Tin bất ổn làm tăng độ rủi ro
- Tin tích cực làm tăng confidence có kiểm soát

---

## 5. Đầu ra hệ thống

Thay vì chỉ trả về một con số dự báo, hệ thống cung cấp:

- Lợi nhuận kỳ vọng (Expected Return)
- Độ bất định (Uncertainty)
- Xác suất tăng giá P(Return > 0)
- Xác suất đạt mức lợi nhuận mục tiêu
- Value-at-Risk (VaR 95%)
- Khuyến nghị giao dịch (BUY / HOLD / AVOID)

Ví dụ đầu ra:

- Expected Return: +3.2%
- Uncertainty: 2.5%
- Probability Gain: 72%
- VaR 95%: -1.8%
- Recommendation: Moderate BUY

---

## 6. Mục tiêu tối ưu

Hệ thống không nhằm tối đa hóa lợi nhuận tuyệt đối.

Thay vào đó tập trung vào:

- Tối ưu lợi nhuận điều chỉnh theo rủi ro (risk-adjusted return)
- Kiểm soát drawdown
- Duy trì sự ổn định hiệu suất theo thời gian

---

## 7. Phạm vi giai đoạn hiện tại

Trong giai đoạn phát triển ban đầu:

- Hệ thống chạy hoàn toàn trên máy cá nhân.
- Training thực hiện bằng Google Colab hoặc local GPU.
- Inference chạy qua Python AI Service (FastAPI).
- Backend web sử dụng NodeJS.
- Chưa triển khai full automation retraining.

---

## 8. Tính mới và đóng góp

Hệ thống kết hợp:

- Conditional Forecasting (dự báo theo horizon linh hoạt)
- Probabilistic Modeling (dự báo phân phối thay vì giá trị điểm)
- LLM-based News Adjustment
- Risk-aware Decision Engine

Đây không chỉ là một mô hình dự báo giá, mà là một hệ thống hỗ trợ quyết định giao dịch định lượng có biểu diễn rủi ro rõ ràng.

---

## 9. Tóm tắt ngắn gọn

Xây dựng một hệ thống dự báo lợi nhuận cổ phiếu VIC theo horizon linh hoạt, biểu diễn dưới dạng phân phối xác suất, tích hợp tác động tin tức bằng LLM và cung cấp thông tin rủi ro định lượng nhằm hỗ trợ quyết định giao dịch.