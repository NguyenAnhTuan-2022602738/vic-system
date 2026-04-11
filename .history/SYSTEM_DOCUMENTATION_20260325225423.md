# 📘 VIC Forecast System - Tổng hợp Hệ thống & Hướng dẫn Vận hành

Hệ thống dự báo Xác suất Có điều kiện Đa phương thức cho cổ phiếu VIC (Vingroup). Kết hợp Phân tích Kỹ thuật (Technical Analysis) và Phân tích Tâm lý Tin tức (Sentiment Analysis).

---

## 1. 🏗️ Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo mô hình Microservices/Service-Oriented Architecture (SOA):

- **AI Service (FastAPI / Python)**:
  - **Mô hình chính**: Custom Multi-layer Manual LSTM (tự triển khai cổng Forget, Input, Output).
  - **Mô hình so sánh**: Random Forest (Thủ công) & Linear Regression (Thủ công).
  - **Đầu ra**: Dự báo xác suất (Gaussian Distribution - μ, σ).
  - **Tính năng**: Tính toán rủi ro (VaR 95%, Sharpe Ratio), Backtest MAE động.
- **Web Backend (Node.js / Express)**:
  - **Orchestrator**: Kết nối Frontend với AI Service.
  - **Database**: MongoDB (Lưu trữ lịch sử dự báo và kết quả thực tế).
  - **Features**: Quản lý lịch sử, Cảnh báo (Telegram integration).
- **Frontend (Next.js / Tailwind CSS)**:
  - **Dashboard**: Hiển thị biểu đồ giá Real-time, Technical Indicators (RSI, MACD).
  - **Visualization**: Biểu đồ xác suất, Biểu đồ so sánh đa mô hình, Tác động tin tức.

---

## 2. 🔄 Luồng dữ liệu (Data Flow)

1. **Dữ liệu thô**: Lấy từ `vnstock` (giá lịch sử 2015-2025).
2. **Feature Engineering**:
   - `scripts/fetch_data.py`: Tải dữ liệu OHLCV.
   - `feature_builder.py`: Tính toán RSI, MACD, MA20, Volatility (Norm).
3. **Huấn luyện (Training)**:
   - Sử dụng **Chronological Split** (chia theo thời gian) để tránh "Rò rỉ dữ liệu".
   - Tối ưu hàm lỗi **Gaussian NLL Loss** (Negative Log-Likelihood).
4. **Inference (Dự báo)**:
   - Technical Input (LSTM/RF/LR) + Sentiment Input (LLM Ollama).
   - Fusion: μ_adj = μ_tech + α * sentiment_score.
5. **Dashboard**: Hiển thị dự báo kèm mức độ tin cậy.

---

## 3. 🚀 Hướng dẫn Cài đặt & Chạy Chương trình

### Yêu cầu hệ thống:
- Python 3.10+
- Node.js 18+
- MongoDB 7.0 (Local hoặc Atlas)
- Ollama (Chạy model `vistral:7b` - Tùy chọn)

### Bước 1: Chuẩn bị dữ liệu & Model
```bash
# Cài đặt thư viện Python
pip install -r ai-service/requirements.txt

# Tải dữ liệu VIC mới nhất
python scripts/fetch_data.py

# Huấn luyện model LSTM (Đã fix Data Leakage)
cd ai-service && python scripts/train.py --epochs 100
```

### Bước 2: Khởi chạy các Service (3 Terminal riêng)

**Terminal 1: AI Service**
```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2: Web Backend**
```bash
cd web-backend
npm install
npm run dev
```

**Terminal 3: Frontend**
```bash
cd frontend
npm install
npm run dev
```
@(3000, 3005, 8000) | ForEach-Object {
    $proc = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Cleaning up port $_..." -ForegroundColor Cyan
        Stop-Process -Id $proc.OwningProcess -Force
    }
}
---

## 4. 🧪 Hướng dẫn Kiểm thử (Testing)

### Kiểm thử Tự động (Automated Tests)
Hệ thống sử dụng `pytest` cho AI Service:
```bash
cd ai-service
pytest tests/
```

### Kiểm thử Tính năng Dự báo Đa mô hình
Tôi có cung cấp một logic kiểm tra nhanh MAE thực tế cho RF và LR:
1. Truy cập Dashboard Frontend.
2. Cuộn xuống phần **"Model Comparison"**.
3. Nếu MAE cho RF/LR hiển thị giá trị thực (ví dụ 1.53% thay vì 0.0437), nghĩa là logic Backtest đang hoạt động.

### Kiểm thử Luồng API
Sử dụng cURL hoặc Postman:
```bash
curl -X POST http://localhost:8000/api/v1/forecast \
     -H "Content-Type: application/json" \
     -d '{"horizon": 5, "target_return": 0.05}'
```

---

## 📅 Lộ trình hoàn thiện (Roadmap)
- Phase 01: Thiết lập hạ tầng & Kết nối (Done)
- Phase 02: Tối ưu kiến trúc AI (Manual LSTM) (Done)
- Phase 06: Tiến hóa Đa mô hình (LSTM vs RF vs LR) (Done)
- Phase 08: Trading Signal Engine (Done)

---
*Tài liệu này được tổng hợp bởi Antigravity AI Assistant.*
