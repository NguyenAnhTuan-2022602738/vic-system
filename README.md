# VIC Forecast System

> **Hệ thống Dự báo Xác suất Có điều kiện Đa phương thức** cho cổ phiếu VIC (Vingroup)

## 📋 Tổng quan

VIC System là hệ thống dự báo lợi nhuận cổ phiếu sử dụng:
- **Conditional LSTM** — Mô hình LSTM xác suất, dự đoán (μ, σ) cho horizon linh hoạt
- **LLM tự host** — Phân tích tâm lý tin tức tiếng Việt qua Ollama (Vistral-7B)
- **Điều chỉnh Bayesian** — Kết hợp dự báo kỹ thuật + tâm lý tin tức

## 🏗️ Kiến trúc

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│ Web Backend  │────▶│ AI Service  │
│  React/Vite │     │ Express/Node │     │  FastAPI     │
│  port 5173  │     │  port 3000   │     │  port 8000   │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
                    ┌──────▼──────┐     ┌──────▼──────┐
                    │  MongoDB    │     │  Ollama LLM │
                    │  port 27017 │     │  port 11434 │
                    └─────────────┘     └─────────────┘
```

## 🛠️ Stack công nghệ

| Thành phần | Công nghệ |
|-----------|----------|
| AI Service | Python 3.11, FastAPI, PyTorch, vnstock |
| Web Backend | Node.js 18, Express, MongoDB/Mongoose |
| Frontend | React 18, Vite, Axios |
| LLM | Ollama (Vistral-7B / Qwen2.5-7B) |
| Database | MongoDB 7 |
| Container | Docker & Docker Compose |

## 🚀 Khởi động nhanh

### Cách 1: Docker (Khuyến nghị)

```bash
# Cài Ollama + tải model trước
ollama pull vistral:7b

# Khởi động tất cả
docker-compose up -d

# Mở frontend
open http://localhost:5173
```

### Cách 2: Thủ công

```bash
# 1. Fetch dữ liệu VIC
python scripts/fetch_data.py

# 2. Train model
cd ai-service && python scripts/train.py --epochs 100

# 3. Chạy 3 services (mỗi terminal 1 lệnh)
cd ai-service && uvicorn app.main:app --reload
cd web-backend && npm run dev
cd frontend && npm run dev
```

> Xem chi tiết: [docs/setup/getting-started.md](docs/setup/getting-started.md)

## 📊 Tính năng

### Dự báo Xác suất
- Dự đoán lợi nhuận kỳ vọng (μ) và độ bất định (σ)
- Horizon linh hoạt: 1-30 ngày
- Xác suất tăng giá, VaR 95%, khuyến nghị BUY/HOLD/AVOID

### Phân tích Tin tức
- Phân tích tâm lý bài tin tiếng Việt qua LLM tự host
- Đánh giá mức ảnh hưởng lên giá cổ phiếu
- Điều chỉnh dự báo theo tin tức: μ_adj, σ_adj

### Nhật ký Giao dịch
- Lưu lịch sử dự báo + kết quả thực tế
- Theo dõi PnL
- Thống kê dashboard

## 📁 Cấu trúc dự án

```
vic-system/
├── ai-service/          # Dịch vụ AI (Python/FastAPI)
│   ├── app/             # Code chính (Clean Architecture)
│   ├── scripts/         # Script huấn luyện
│   └── models/          # Trọng số model đã train
├── web-backend/         # Web Backend (NodeJS/Express)
│   └── src/             # Code chính (Feature modules)
├── frontend/            # Frontend (React/Vite)
│   └── src/             # Code chính (Feature-based)
├── data/                # Dữ liệu thô và xử lý
├── scripts/             # Script tiện ích
├── docs/                # Documentation
│   ├── api/             # API reference
│   ├── modules/         # Module reference
│   ├── functions/       # Function reference
│   ├── setup/           # Hướng dẫn cài đặt
│   ├── decisions/       # Architecture Decision Records
│   └── changelog/       # Lịch sử thay đổi
└── docker-compose.yml   # Orchestration
```

## 📚 Tài liệu

| Tài liệu | Đường dẫn |
|----------|----------|
| API Reference | [docs/api/api-reference.md](docs/api/api-reference.md) |
| Module Reference | [docs/modules/module-reference.md](docs/modules/module-reference.md) |
| Function Reference | [docs/functions/function-reference.md](docs/functions/function-reference.md) |
| Getting Started | [docs/setup/getting-started.md](docs/setup/getting-started.md) |
| Ollama Setup | [docs/setup/ollama-setup.md](docs/setup/ollama-setup.md) |
| Changelog | [docs/changelog/](docs/changelog/) |
| ADR | [docs/decisions/](docs/decisions/) |

## 📐 Công thức cốt lõi

### Mô hình dự báo
- **LSTM Output**: h = LSTM(sequence₃₀) → concat(h, embed(horizon))
- **Tham số**: μ = W_μ(combined), σ = Softplus(W_σ(combined))
- **Loss**: NLL = 0.5 × [log(σ²) + (y - μ)² / σ²]

### Đánh giá rủi ro
- **P(Gain)**: 1 - Φ((0 - μ) / σ)
- **VaR 95%**: μ - 1.65σ
- **Sharpe**: μ / σ

### Điều chỉnh tin tức
- **μ_adj** = μ × (1 + α × sentiment × impact)
- **σ_adj** = σ × (1 + β × |sentiment| × impact)

## 📜 License

MIT