"""
Bộ phân tích tâm lý tin tức sử dụng LLM tự host qua Ollama.
Phân tích tin tức tiếng Việt về cổ phiếu VIC.
"""

from app.domain.news_analysis.llm_loader import query_llm
from app.core.logger import logger


def analyze_sentiment(text: str) -> float:
    """
    Phân tích tâm lý (sentiment) của bài tin tức tiếng Việt.

    Sử dụng LLM tự host (Vistral-7B hoặc Qwen2.5-7B) qua Ollama
    để hiểu văn bản tiếng Việt và trả về điểm tâm lý.

    Tham số:
        text: Nội dung bài tin tức tiếng Việt

    Trả về:
        sentiment_score trong [-1, 1]
        -1 = rất tiêu cực, 0 = trung tính, 1 = rất tích cực
    """
    prompt = f"""Bạn là chuyên gia phân tích tài chính. Hãy đánh giá tâm lý (sentiment) của tin tức sau đây đối với cổ phiếu VIC (Vingroup).

Tin tức: "{text}"

Trả về DUY NHẤT một số thực từ -1.0 đến 1.0:
- -1.0: Rất tiêu cực (tin xấu nghiêm trọng)
- 0.0: Trung tính
- 1.0: Rất tích cực (tin tốt mạnh)

Chỉ trả về số, không giải thích."""

    try:
        response = query_llm(prompt)
        score = float(response.strip())
        return max(-1.0, min(1.0, score))  # Giới hạn trong [-1, 1]
    except (ValueError, Exception) as e:
        logger.warning(f"Phân tích tâm lý thất bại: {e}. Trả về trung tính.")
        return 0.0
