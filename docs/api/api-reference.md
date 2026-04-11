# API Documentation — VIC System

## Tổng quan

Hệ thống gồm 2 API service:
- **AI Service** (Python/FastAPI) — port 8000
- **Web Backend** (NodeJS/Express) — port 3000

Frontend giao tiếp với Web Backend, Web Backend proxy tới AI Service.

---

## AI Service API (port 8000)

### Health Check

```
GET /health
```

**Phản hồi:**
```json
{
  "success": true,
  "data": { "status": "healthy", "service": "vic-ai-service" }
}
```

---

### Dự báo

```
POST /api/v1/forecast
```

**Request body:**
```json
{
  "horizon": 5,
  "target_return": 0.05
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `horizon` | int | ✅ | Số ngày dự báo (1-30) |
| `target_return` | float | ❌ | Ngưỡng lợi nhuận mục tiêu (mặc định 0.05) |

**Phản hồi 200:**
```json
{
  "success": true,
  "data": {
    "horizon": 5,
    "expected_return": 0.032145,
    "uncertainty": 0.025312,
    "probability_gain": 0.8952,
    "probability_target": 0.4523,
    "var_95": -0.018234,
    "recommendation": "BUY"
  }
}
```

| Trường | Mô tả |
|--------|-------|
| `expected_return` | μ — Lợi nhuận kỳ vọng |
| `uncertainty` | σ — Độ lệch chuẩn |
| `probability_gain` | P(Return > 0) |
| `probability_target` | P(Return > target_return) |
| `var_95` | Value-at-Risk tại 95% confidence |
| `recommendation` | BUY / HOLD / AVOID |

---

### Phân tích Tin tức

```
POST /api/v1/news/analyze
```

**Request body:**
```json
{
  "text": "Vingroup báo lãi ròng 5.000 tỷ đồng quý 4/2025..."
}
```

**Phản hồi 200:**
```json
{
  "success": true,
  "data": {
    "sentiment_score": 0.65,
    "impact_weight": 0.80,
    "summary": "Tâm lý: 0.65, Ảnh hưởng: 0.80"
  }
}
```

---

### Phân tích Hàng loạt

```
POST /api/v1/news/batch
```

**Request body:**
```json
{
  "articles": [
    { "title": "Tiêu đề 1", "content": "Nội dung..." },
    { "title": "Tiêu đề 2", "content": "Nội dung..." }
  ]
}
```

---

### Tin tức Mới nhất

```
GET /api/v1/news/latest?limit=5
```

**Phản hồi 200:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Vingroup báo lãi...",
      "source": "CafeF",
      "sentiment_score": 0.65,
      "impact_weight": 0.80
    }
  ],
  "count": 3
}
```

---

### Dự báo Điều chỉnh

```
POST /api/v1/forecast/adjusted
```

**Request body:**
```json
{
  "horizon": 5,
  "news_text": "Vingroup công bố kế hoạch mở rộng..."
}
```

**Phản hồi 200:**
```json
{
  "success": true,
  "data": {
    "original_mu": 0.032,
    "original_sigma": 0.025,
    "adjusted_mu": 0.045,
    "adjusted_sigma": 0.028,
    "sentiment_score": 0.65,
    "impact_weight": 0.80,
    "probability_gain": 0.9123,
    "var_95": -0.012,
    "recommendation": "BUY"
  }
}
```

---

## Web Backend API (port 3000)

Web Backend proxy tới AI Service và thêm các tính năng:

### Dự báo (proxy + lưu lịch sử)

```
POST /api/v1/forecast          → Proxy tới AI + lưu MongoDB
POST /api/v1/forecast/adjusted → Proxy tới AI + lưu MongoDB
GET  /api/v1/forecast/history?limit=20 → Lịch sử dự báo
```

### Tin tức (proxy + cache MongoDB)

```
POST /api/v1/news/analyze → Kiểm tra cache trước, gọi AI nếu cần
GET  /api/v1/news/recent?limit=10 → Tin tức gần đây đã phân tích
```

### Giao dịch (CRUD)

```
GET  /api/v1/trades  → Danh sách giao dịch
POST /api/v1/trades  → Tạo giao dịch mới
```

**Request body (tạo giao dịch):**
```json
{
  "horizon": 5,
  "predicted_mu": 0.032,
  "predicted_sigma": 0.025
}
```

### Dashboard

```
GET /api/v1/dashboard/stats
```

**Phản hồi 200:**
```json
{
  "success": true,
  "data": {
    "counts": {
      "forecasts": 42,
      "news_analyzed": 15,
      "trades": 8
    },
    "recommendations": {
      "buy": 25,
      "hold": 12,
      "avoid": 5
    },
    "recent_forecasts": [...]
  }
}
```

---

## Mã lỗi chung

| HTTP Code | Ý nghĩa |
|-----------|---------|
| 200 | Thành công |
| 400 | Dữ liệu request không hợp lệ |
| 422 | Validation error (FastAPI) |
| 500 | Lỗi hệ thống |

Tất cả lỗi trả về dạng:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Mô tả lỗi"
  }
}
```
