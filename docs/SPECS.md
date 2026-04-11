# SPECS: VIC Multimodal Forecasting System

## 1. Executive Summary
Hệ thống dự báo lợi nhuận cổ phiếu VIC (Vingroup) trong khoảng thời gian linh hoạt (1-30 ngày). Hệ thống kết hợp phân tích kỹ thuật (Technical Indicators) và phân tích định tính từ tin tức (LLM Sentiment) để đưa ra dự báo dưới dạng phân phối xác suất.

## 2. User Roles & Stories
- **User (Investor):** 
  - Xem dự báo m%/σ cho VIC trong X ngày.
  - Xem xác suất lãi/lỗ và rủi ro VaR 95%.
  - Xem tóm tắt tin tức và cách tin tức ảnh hưởng đến dự báo.

## 3. System Architecture
### AI Service (Python/FastAPI)
- **Forecasting Engine:** Custom Manual LSTM (Tự viết logic cổng: Forget, Input, Output, Cell state).
- **Phân phối xác suất:** Đầu ra Gaussian (μ, σ). Đã huấn luyện 50 epochs (MAE ~4.4%).
- **News Engine:** Ollama (Vistral/Qwen) phân tích sentiment và impact.

### Web Backend (NodeJS/Express)
- **Orchestrator:** Chạy tại port 3005. Kết nối MongoDB và điều phối AI Client.
- **Data Proxy:** Tích hợp Vnstock cho dữ liệu VIC thời gian thực.

### Frontend (NextJS/Tailwind)
- **Dashboard:** Biểu đồ Price, Distribution (Bell Curve), Technical indicators.
- **Config:** Chọn Horizon X ngày.

## 4. Key Logic (Accuracy Priority)
- **Loss Function:** Negative Log-likelihood (NLL) để tối ưu cả giá trị dự báo và độ tin cậy.
- **Feature Set:** Open, High, Low, Close, Volume + RSI, MACD, MA20, Volatility.

## 5. Implementation Roadmap
- **Phase 1:** Connectivity (Setup .env, Fix ports).
- **Phase 2:** AI Refinement (Accuracy focus).
- **Phase 3:** Full Integration.

## 6. Tech Stack
- **AI:** PyTorch, FastAPI, Ollama.
- **Web:** Next.js 16 (App Router), Tailwind v4, Node.js, MongoDB.
