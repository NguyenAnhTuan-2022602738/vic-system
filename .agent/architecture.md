# KIẾN TRÚC HỆ THỐNG (LOCAL)

## High-level

User
 ↓
React Frontend
 ↓
NodeJS Backend
 ↓
Python AI Service
 ↓
Database

---

## AI Service

### Conditional LSTM

Input:
- (batch, 30, feature_dim)
- Horizon X

Output:
- μ
- log(σ²)

---

### LLM Engine

Input:
- News text

Output:
- sentiment_score
- impact_weight

---

### Adjustment Layer

Điều chỉnh μ và σ theo sentiment.

---

### Risk Engine

Tính:
- Probability gain
- VaR
- Decision