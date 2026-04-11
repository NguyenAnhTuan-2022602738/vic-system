"""
Logic điều chỉnh dự báo.
Điều chỉnh μ và σ dựa trên tâm lý và mức ảnh hưởng tin tức.
"""

from app.core.config import settings


def adjust_forecast(
    mu: float,
    sigma: float,
    sentiment_score: float,
    impact_weight: float,
    alpha: float | None = None,
    beta: float | None = None,
) -> tuple[float, float]:
    """
    Điều chỉnh tham số dự báo dựa trên tâm lý tin tức.

    μ_adj = μ × (1 + α × sentiment × impact)
    σ_adj = σ × (1 + β × |sentiment| × impact)

    Cơ chế hoạt động:
    - Tin xấu làm giảm lợi nhuận kỳ vọng
    - Tin bất ổn làm tăng độ bất định
    - Tin tích cực tăng confidence có kiểm soát

    Tham số:
        mu: Lợi nhuận kỳ vọng gốc
        sigma: Độ bất định gốc
        sentiment_score: Tâm lý trong [-1, 1]
        impact_weight: Trọng số ảnh hưởng trong [0, 1]
        alpha: Ghi đè α (mặc định từ config)
        beta: Ghi đè β (mặc định từ config)

    Trả về:
        (mu_đã_điều_chỉnh, sigma_đã_điều_chỉnh)
    """
    alpha = alpha if alpha is not None else settings.ALPHA
    beta = beta if beta is not None else settings.BETA

    mu_adj = mu * (1 + alpha * sentiment_score * impact_weight)
    sigma_adj = sigma * (1 + beta * abs(sentiment_score) * impact_weight)

    return mu_adj, sigma_adj
