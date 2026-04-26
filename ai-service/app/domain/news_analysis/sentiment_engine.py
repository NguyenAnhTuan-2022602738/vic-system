"""
Bộ phân tích tâm lý tin tức sử dụng LLM tự host qua Ollama.
Phân tích tin tức tiếng Việt về cổ phiếu VIC.
"""

from app.domain.news_analysis.llm_loader import query_llm
from app.core.logger import logger


def analyze_sentiment(title: str, content: str = "") -> dict:
    """
    Phân tích tâm lý sâu dựa trên tiêu đề và nội dung chi tiết bài báo.
    """
    # Tối ưu nội dung để không quá dài
    truncated_content = content[:2000] if content else "Không có nội dung chi tiết."
    
    prompt = f"""Bạn là chuyên gia phân tích tài chính cao cấp của hệ thống VIC. Hãy đánh giá tác động của tin tức sau đối với Vingroup (VIC).

TIÊU ĐỀ: "{title}"
NỘI DUNG CHI TIẾT: "{truncated_content}"

NHIỆM VỤ:
1. Đối chiếu Tiêu đề và Nội dung bài báo để phát hiện mâu thuẫn hoặc tin giật gân.
2. Đánh giá tác động tài chính: Tin tức này ảnh hưởng thế nào đến VIC?
3. Đưa ra điểm số Sentiment từ -1.0 (Tiêu cực) đến 1.0 (Tích cực).

YÊU CẦU TRẢ VỀ JSON DUY NHẤT:
{{
    "sentiment": <số thực từ -1.0 đến 1.0>,
    "reasoning": "<Giải thích ngắn gọn 1 câu dựa trên bằng chứng trong nội dung>",
    "category": <"Direct"|"Industry"|"Macro"|"Global"|"Geopolitical">,
    "impact_score": <độ mạnh của tin từ 0 đến 1>
}}

Chỉ trả về JSON, không giải thích gì thêm."""

    try:
        import json
        response = query_llm(prompt)
        
        # Làm sạch response
        clean_response = response.strip()
        if "```json" in clean_response:
            clean_response = clean_response.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_response:
            clean_response = clean_response.split("```")[1].split("```")[0].strip()
            
        result = json.loads(clean_response)
        return {
            "sentiment": max(-1.0, min(1.0, float(result.get("sentiment", 0.0)))),
            "reasoning": result.get("reasoning", "Dựa trên phân tích nội dung chi tiết."),
            "category": result.get("category", "Market"),
            "impact_score": float(result.get("impact_score", 0.5))
        }
    except Exception as e:
        logger.warning(f"Phân tích tâm lý thất bại: {e}. Trả về trung tính.")
        return {
            "sentiment": 0.0,
            "reasoning": "Không thể phân tích nội dung chi tiết.",
            "category": "Market",
            "impact_score": 0.3
        }
