"""
Bộ tính Value-at-Risk (Giá trị rủi ro).
"""


def calculate_var(mu: float, sigma: float, confidence: float = 0.95) -> float:
    """
    Tính Value-at-Risk tại mức tin cậy cho trước.

    VaR(95%) = μ - 1.65σ
    VaR(99%) = μ - 2.33σ

    Tham số:
        mu: Lợi nhuận kỳ vọng
        sigma: Độ lệch chuẩn
        confidence: Mức tin cậy (mặc định 0.95)

    Trả về:
        Giá trị VaR (âm nghĩa là khoản lỗ dự kiến trong trường hợp xấu nhất)
    """
    from scipy.stats import norm

    z = norm.ppf(1 - confidence)  # -1.65 cho 95%
    return float(mu + z * sigma)
