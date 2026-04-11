"""
Xây dựng đặc trưng cho dữ liệu cổ phiếu VIC.
Tạo chuỗi input từ dữ liệu OHLCV thô + chỉ báo kỹ thuật.
"""

import numpy as np
import pandas as pd


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Tính chỉ số sức mạnh tương đối (RSI)."""
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


def compute_macd(
    series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Tính MACD, Signal Line và Histogram."""
    ema_fast = series.ewm(span=fast).mean()
    ema_slow = series.ewm(span=slow).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def compute_ma(series: pd.Series, period: int = 20) -> pd.Series:
    """Tính đường trung bình động (MA)."""
    return series.rolling(window=period).mean()


def compute_volatility(series: pd.Series, period: int = 20) -> pd.Series:
    """Tính biến động giá (độ lệch chuẩn của lợi nhuận theo cửa sổ trượt)."""
    returns = series.pct_change()
    return returns.rolling(window=period).std()


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Xây dựng DataFrame đặc trưng từ dữ liệu OHLCV thô.

    Cột đầu vào cần có: date, open, high, low, close, volume
    Thêm các cột: rsi, macd, ma20, volatility, returns

    Tham số:
        df: DataFrame OHLCV thô

    Trả về:
        DataFrame với các đặc trưng đã tính, đã loại bỏ hàng NaN
    """
    df = df.copy()
    df["returns"] = df["close"].pct_change()
    df["rsi"] = compute_rsi(df["close"])
    df["macd"], _, _ = compute_macd(df["close"])
    df["ma20"] = compute_ma(df["close"], 20)
    df["volatility"] = compute_volatility(df["close"])

    # Chuẩn hóa khối lượng giao dịch
    df["volume_norm"] = df["volume"] / df["volume"].rolling(window=20).mean()

    # Thay thế inf bằng NaN
    df = df.replace([np.inf, -np.inf], np.nan)

    # Loại bỏ hàng NaN do quá trình tính chỉ báo cần dữ liệu warmup
    df = df.dropna().reset_index(drop=True)

    return df


def create_sequences(
    df: pd.DataFrame,
    seq_len: int = 60,
    feature_cols: list[str] | None = None,
) -> list[dict]:
    """
    Tạo mẫu huấn luyện: (chuỗi_60_ngày, horizon_X, lợi_nhuận_thực_tế).

    Tham số:
        df: DataFrame đặc trưng
        seq_len: Độ dài chuỗi đầu vào (mặc định 60 ngày)

        feature_cols: Các cột dùng làm đặc trưng

    Trả về:
        Danh sách dict với keys: sequence, horizon, target_return
    """
    if feature_cols is None:
        feature_cols = [
            "open", "high", "low", "close", "volume_norm",
            "rsi", "macd", "ma20", "volatility",
        ]

    samples = []
    max_horizon = 10  # Dự báo từ 1 đến 10 ngày

    for i in range(seq_len, len(df) - max_horizon):
        sequence = df[feature_cols].iloc[i - seq_len : i].values

        for horizon in range(1, max_horizon + 1):
            if i + horizon >= len(df):
                break

            price_now = df["close"].iloc[i]
            price_future = df["close"].iloc[i + horizon]

            # Tránh chia cho 0
            if price_now == 0 or np.isnan(price_now) or np.isnan(price_future):
                continue

            target_return = (price_future - price_now) / price_now

            # Bỏ qua giá trị bất thường
            if np.isnan(target_return) or np.isinf(target_return) or abs(target_return) > 0.5:
                continue

            # Kiểm tra sequence không có NaN/inf
            if np.any(np.isnan(sequence)) or np.any(np.isinf(sequence)):
                continue

            samples.append({
                "sequence": sequence.astype(np.float32),
                "horizon": horizon,
                "target_return": float(target_return),
            })

    return samples
