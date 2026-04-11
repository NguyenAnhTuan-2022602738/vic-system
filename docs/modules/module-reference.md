# Module Documentation — VIC System

## Kiến trúc tổng quan

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

---

## AI Service (`ai-service/`)

### Cấu trúc thư mục

```
ai-service/
├── app/
│   ├── main.py                 # Entry point FastAPI
│   ├── core/
│   │   ├── config.py           # Cấu hình (Pydantic Settings)
│   │   ├── logger.py           # Logger
│   │   └── dependencies.py     # Dependency Injection
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py       # GET /health
│   │   │   ├── forecast.py     # POST /api/v1/forecast
│   │   │   └── news.py         # POST /api/v1/news/*
│   │   └── schemas/
│   │       ├── forecast_schema.py  # Request/Response schemas
│   │       └── news_schema.py
│   ├── domain/
│   │   ├── forecasting/
│   │   │   ├── conditional_model.py  # Conditional LSTM
│   │   │   ├── feature_builder.py    # RSI, MACD, MA20
│   │   │   ├── data_scaler.py       # MinMax scaler
│   │   │   ├── dataset.py           # PyTorch Dataset
│   │   │   └── probabilistic_head.py # NLL loss
│   │   ├── risk/
│   │   │   ├── probability_engine.py # P(gain), P(target)
│   │   │   ├── var_calculator.py     # VaR 95%
│   │   │   └── decision_engine.py    # BUY/HOLD/AVOID
│   │   ├── news_analysis/
│   │   │   ├── sentiment_engine.py   # Tâm lý qua LLM
│   │   │   ├── impact_engine.py      # Mức ảnh hưởng
│   │   │   ├── llm_loader.py         # Ollama API wrapper
│   │   │   ├── news_scraper.py       # Thu thập tin tức
│   │   │   └── news_cache.py         # Cache file-based
│   │   └── adjustment/
│   │       └── adjustment_logic.py   # μ_adj, σ_adj
│   ├── infrastructure/
│   │   └── model_registry/
│   │       └── loader.py             # Lưu/tải model
│   └── services/
│       ├── forecast_service.py       # Điều phối dự báo
│       └── news_service.py           # Điều phối tin tức
├── scripts/
│   └── train.py                      # Pipeline huấn luyện
├── requirements.txt
└── Dockerfile
```

### Module chi tiết

#### `domain/forecasting` — Dự báo xác suất
- **conditional_model.py**: LSTM 2 lớp + horizon embedding → (μ, σ)
- **feature_builder.py**: Tính RSI(14), MACD(12,26), MA20, Volatility(20)
- **data_scaler.py**: MinMax scaling, lưu tham số JSON
- **dataset.py**: PyTorch Dataset tạo samples (sequence, horizon, target)
- **probabilistic_head.py**: NLL = 0.5[log(σ²) + (y-μ)²/σ²]

#### `domain/risk` — Đánh giá rủi ro
- **probability_engine.py**: P(Return > threshold) = 1 - Φ(z)
- **var_calculator.py**: VaR = μ - 1.65σ
- **decision_engine.py**: BUY nếu P(gain)>65% ∧ VaR>-3% ∧ Sharpe>0.5

#### `domain/news_analysis` — Phân tích tin tức
- **sentiment_engine.py**: Gọi LLM → sentiment ∈ [-1, 1]
- **impact_engine.py**: Gọi LLM → impact ∈ [0, 1]
- **llm_loader.py**: Ollama API wrapper
- **news_scraper.py**: Lấy tin từ RSS (placeholder)
- **news_cache.py**: Cache kết quả phân tích (TTL 24h)

#### `domain/adjustment` — Điều chỉnh dự báo
- μ_adj = μ × (1 + α × sentiment × impact)
- σ_adj = σ × (1 + β × |sentiment| × impact)

---

## Web Backend (`web-backend/`)

### Cấu trúc thư mục

```
web-backend/src/
├── app.js                          # Express entry point
├── config/
│   ├── env.js                      # Biến môi trường
│   └── database.js                 # Kết nối MongoDB
├── middleware/
│   └── error_handler.js            # Xử lý lỗi toàn cục
├── integrations/
│   └── ai_client.js                # Axios → AI Service
└── modules/
    ├── forecast/
    │   ├── forecast.routes.js      # POST /, POST /adjusted, GET /history
    │   ├── forecast.controller.js
    │   ├── forecast.service.js     # Proxy AI + lưu MongoDB
    │   └── forecast.repository.js  # Mongoose: ForecastCache
    ├── news/
    │   ├── news.routes.js          # POST /analyze, GET /recent
    │   ├── news.controller.js
    │   ├── news.service.js         # Cache MongoDB + proxy AI
    │   └── news.repository.js      # Mongoose: NewsCache (TTL)
    ├── trade/
    │   ├── trade.routes.js         # GET /, POST /
    │   ├── trade.controller.js
    │   ├── trade.service.js
    │   └── trade.repository.js     # Mongoose: TradeLog
    └── dashboard/
        ├── dashboard.routes.js     # GET /stats
        ├── dashboard.controller.js
        └── dashboard.service.js    # Thống kê tổng hợp

```

### MongoDB Collections

| Collection | Mô tả |
|-----------|-------|
| `forecastcaches` | Lịch sử dự báo (horizon, μ, σ, khuyến nghị) |
| `newscaches` | Cache phân tích tin (TTL 24h tự xóa) |
| `tradelogs` | Nhật ký giao dịch (entry_date, PnL) |

---

## Frontend (`frontend/`)

### Cấu trúc thư mục

```
frontend/src/
├── main.jsx                    # Entry point
├── index.css                   # Kiểu toàn cục (dark theme)
├── app/
│   └── App.jsx                 # Root + Router
├── features/
│   ├── forecast/pages/
│   │   └── ForecastPage.jsx    # Trang dự báo
│   ├── news/pages/
│   │   └── NewsPage.jsx        # Trang phân tích tin tức
│   └── trades/pages/
│       └── TradeLogPage.jsx    # Trang nhật ký giao dịch
└── services/
    └── api.js                  # Axios API client
```

### Các trang

| Route | Trang | Chức năng |
|-------|-------|-----------|
| `/` | ForecastPage | Slider horizon → kết quả dự báo |
| `/news` | NewsPage | Textarea → tâm lý/ảnh hưởng + dự báo điều chỉnh |
| `/trades` | TradeLogPage | Bảng GD + thống kê PnL |
