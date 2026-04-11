"""
Bộ đánh giá mức ảnh hưởng tin tức.
Xác định tin tức ảnh hưởng bao nhiêu đến giá cổ phiếu.
"""

from app.domain.news_analysis.llm_loader import query_llm
from app.core.logger import logger


def evaluate_impact(text: str) -> float:
    """
    Đánh giá mức ảnh hưởng của bài tin tức lên giá cổ phiếu VIC.

    Tham số:
        text: Nội dung bài tin tức tiếng Việt

    Trả về:
        impact_weight trong [0, 1]
        0 = không ảnh hưởng, 1 = ảnh hưởng rất mạnh
    """
    prompt = f"""Bạn là chuyên gia phân tích tài chính. Hãy đánh giá mức độ ảnh hưởng của tin tức sau đây đối với giá cổ phiếu VIC (Vingroup).

Tin tức: "{text}"

Trả về DUY NHẤT một số thực từ 0.0 đến 1.0:
- 0.0: Không ảnh hưởng (tin tức chung chung, không liên quan trực tiếp)
- 0.5: Ảnh hưởng trung bình
- 1.0: Ảnh hưởng rất mạnh (tin tức trực tiếp về tài chính, M&A, pháp lý)

Chỉ trả về số, không giải thích."""

    try:
        response = query_llm(prompt)
        weight = float(response.strip())
        return max(0.0, min(1.0, weight))  # Giới hạn trong [0, 1]
    except (ValueError, Exception) as e:
        logger.warning(f"Đánh giá ảnh hưởng thất bại: {e}. Trả về 0.")
        return 0.0
