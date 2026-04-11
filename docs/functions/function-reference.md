# Function Documentation — VIC System

## AI Service — Hàm chính

### `domain/forecasting/conditional_model.py`

#### `ConditionalLSTM.forward(sequence, horizon)`
- **Mô tả**: Lan truyền thuận qua LSTM + horizon embedding
- **Đầu vào**: `sequence` (batch, 30, 9), `horizon` (batch, 1)
- **Đầu ra**: `mu` (batch, 1), `sigma` (batch, 1)
- **Công thức**: hidden = LSTM(sequence)[-1] → concat(hidden, embed(horizon)) → mu_head, sigma_head

---

### `domain/forecasting/feature_builder.py`

#### `build_features(df)`
- **Mô tả**: Tính chỉ báo kỹ thuật từ dữ liệu OHLCV
- **Đầu vào**: DataFrame với cột date, open, high, low, close, volume
- **Đầu ra**: DataFrame thêm: rsi, macd, ma20, volatility, volume_norm, returns
- **Ghi chú**: Loại bỏ NaN do warmup period (~26 ngày đầu)

#### `create_sequences(df, seq_len=30)`
- **Mô tả**: Tạo mẫu huấn luyện cho LSTM
- **Đầu vào**: DataFrame đặc trưng, độ dài chuỗi
- **Đầu ra**: List[dict] với keys: sequence (30×9), horizon (1-10), target_return

#### `compute_rsi(series, period=14)`
- **Mô tả**: Tính RSI — chỉ số sức mạnh tương đối
- **Công thức**: RSI = 100 - 100/(1 + RS), RS = avg_gain/avg_loss

#### `compute_macd(series, fast=12, slow=26)`
- **Mô tả**: Tính MACD — đường hội tụ phân kỳ
- **Công thức**: MACD = EMA(12) - EMA(26)

#### `compute_volatility(series, period=20)`
- **Mô tả**: Tính biến động giá
- **Công thức**: σ = std(returns, window=20)

---

### `domain/forecasting/probabilistic_head.py`

#### `GaussianNLLLoss.forward(mu, sigma, target)`
- **Mô tả**: Hàm mất mát Gaussian NLL
- **Công thức**: NLL = 0.5 × [log(σ²) + (y - μ)² / σ²]
- **Ý nghĩa**: Khuyến khích μ chính xác VÀ σ được hiệu chuẩn đúng

---

### `domain/forecasting/data_scaler.py`

#### `FeatureScaler.fit(df, feature_cols)`
- **Mô tả**: Tính min/max cho từng cột đặc trưng

#### `FeatureScaler.transform(df)`
- **Mô tả**: Scale giá trị về [0, 1]
- **Công thức**: x_scaled = (x - min) / (max - min)

#### `FeatureScaler.save(path)` / `FeatureScaler.load(path)`
- **Mô tả**: Lưu/tải tham số scaler (JSON format)

---

### `domain/risk/probability_engine.py`

#### `probability_above(mu, sigma, threshold)`
- **Mô tả**: Tính xác suất lợi nhuận vượt ngưỡng
- **Công thức**: P(R > t) = 1 - Φ((t - μ) / σ)

#### `probability_gain(mu, sigma)`
- **Mô tả**: P(R > 0) — xác suất tăng giá

#### `probability_target(mu, sigma, target=0.05)`
- **Mô tả**: P(R > target) — xác suất đạt mục tiêu

---

### `domain/risk/var_calculator.py`

#### `calculate_var(mu, sigma, confidence=0.95)`
- **Mô tả**: Tính Value-at-Risk
- **Công thức**: VaR(95%) = μ + z₀.₀₅ × σ = μ - 1.65σ

---

### `domain/risk/decision_engine.py`

#### `make_recommendation(mu, sigma)`
- **Mô tả**: Tạo khuyến nghị giao dịch
- **Logic**:
  - **BUY**: P(gain) > 65% ∧ VaR > -3% ∧ μ/σ > 0.5
  - **AVOID**: μ < 0
  - **HOLD**: còn lại

---

### `domain/adjustment/adjustment_logic.py`

#### `adjust_forecast(mu, sigma, sentiment_score, impact_weight)`
- **Mô tả**: Điều chỉnh dự báo theo tâm lý tin tức
- **Công thức**:
  - μ_adj = μ × (1 + α × sentiment × impact)
  - σ_adj = σ × (1 + β × |sentiment| × impact)
- **Tham số**: α=0.3 (config), β=0.2 (config)

---

### `domain/news_analysis/sentiment_engine.py`

#### `analyze_sentiment(text)`
- **Mô tả**: Phân tích tâm lý tin tức qua LLM
- **Đầu ra**: score ∈ [-1, 1] (-1=rất tiêu cực, 0=trung tính, 1=rất tích cực)

---

### `domain/news_analysis/impact_engine.py`

#### `evaluate_impact(text)`
- **Mô tả**: Đánh giá mức ảnh hưởng tin tức lên giá cổ phiếu
- **Đầu ra**: weight ∈ [0, 1] (0=không ảnh hưởng, 1=ảnh hưởng rất mạnh)

---

### `infrastructure/model_registry/loader.py`

#### `save_model(model, path, archive=True)`
- **Mô tả**: Lưu trọng số model, tự động archive bản cũ

#### `load_model(model_class, path)`
- **Mô tả**: Tải trọng số model, chuyển sang eval mode

---

### `scripts/train.py`

#### `train(data_path, epochs, lr, batch_size, seq_len)`
- **Mô tả**: Pipeline huấn luyện đầy đủ
- **Quy trình**: Load CSV → Scale → Sequences → Split 80/20 → Train (NLL + Gradient Clip) → LR Schedule → Calibration Eval → Save
- **Output**: `models/active_model.pt`, `models/scaler.json`, `models/metrics.json`
