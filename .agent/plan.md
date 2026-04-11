# KẾ HOẠCH TRIỂN KHAI (LOCAL VERSION)

## Giai đoạn 1 – Data Preparation

- Thu thập dữ liệu VIC 5–10 năm
- Tính chỉ báo kỹ thuật:
  - RSI
  - MACD
  - Moving Average
  - Volatility
- Crawl tin tức liên quan VIC

---

## Giai đoạn 2 – Conditional LSTM

Input:
- 30 ngày price sequence
- Horizon X (ngày)

Output:
- μ (expected return)
- σ (uncertainty)

Loss:
- Negative Log Likelihood

---

## Giai đoạn 3 – LLM Sentiment Engine

Input:
- Nội dung tin tức

Output:
{
  sentiment_score (-1 → 1),
  impact_weight (0 → 1)
}

---

## Giai đoạn 4 – Adjustment Layer

μ_adj = μ × (1 + α × sentiment × impact)

σ_adj = σ × (1 + β × |sentiment| × impact)

---

## Giai đoạn 5 – Decision Engine

Tính:
- P(Return > 0)
- VaR 95%
- Risk ratio (μ/σ)

Trả về:
- BUY / HOLD / AVOID