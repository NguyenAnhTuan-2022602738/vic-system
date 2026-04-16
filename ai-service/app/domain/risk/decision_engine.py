"""
Bộ ra quyết định giao dịch.
Tạo khuyến nghị dựa trên các chỉ số rủi ro.
"""

from app.domain.risk.probability_engine import probability_gain
from app.domain.risk.var_calculator import calculate_var


def make_recommendation(
    mu: float,
    sigma: float,
    p_gain_threshold: float = 0.58,
    var_threshold: float = -0.03,
    sharpe_threshold: float = 0.35,
) -> str:
    """
    Tạo khuyến nghị giao dịch: BUY, HOLD, hoặc AVOID.

    Quy tắc:
        BUY nếu:
            - P(Lợi nhuận > 0) > 65%
            - VaR > -3%
            - μ/σ > ngưỡng sharpe
        HOLD nếu trung tính
        AVOID nếu kỳ vọng âm

    Tham số:
        mu: Lợi nhuận kỳ vọng
        sigma: Độ bất định
        p_gain_threshold: Xác suất tăng tối thiểu để MUA
        var_threshold: VaR tối thiểu để MUA
        sharpe_threshold: Tỷ lệ rủi ro-lợi nhuận tối thiểu để MUA

    Trả về:
        "BUY", "HOLD", hoặc "AVOID"
    """
    p_gain = probability_gain(mu, sigma)
    var = calculate_var(mu, sigma)

    # AVOID: kỳ vọng âm — tránh giao dịch
    if mu < 0:
        return "AVOID"

    # BUY: tất cả tiêu chí đạt — nên mua
    sharpe = mu / sigma if sigma > 0 else 0
    if (
        p_gain > p_gain_threshold
        and var > var_threshold
        and sharpe > sharpe_threshold
    ):
        return "BUY"

    # HOLD: trung tính — giữ nguyên
    return "HOLD"
