"""
Bộ tính xác suất.
Tính P(Lợi nhuận > ngưỡng) từ tham số phân phối Gaussian.
"""

from scipy.stats import norm


def probability_above(mu: float, sigma: float, threshold: float = 0.0) -> float:
    """
    Tính xác suất lợi nhuận vượt ngưỡng.

    P(Return > threshold) = 1 - Φ((threshold - μ) / σ)

    Tham số:
        mu: Lợi nhuận kỳ vọng
        sigma: Độ lệch chuẩn
        threshold: Ngưỡng lợi nhuận (mặc định 0 = xác suất tăng giá)

    Trả về:
        Xác suất trong [0, 1]
    """
    if sigma <= 0:
        return 1.0 if mu > threshold else 0.0

    z = (threshold - mu) / sigma
    return float(1 - norm.cdf(z))


def probability_gain(mu: float, sigma: float) -> float:
    """Tính P(Lợi nhuận > 0) — xác suất tăng giá."""
    return probability_above(mu, sigma, threshold=0.0)


def probability_target(mu: float, sigma: float, target: float = 0.05) -> float:
    """Tính P(Lợi nhuận > mục tiêu) — xác suất đạt lợi nhuận kỳ vọng."""
    return probability_above(mu, sigma, threshold=target)
