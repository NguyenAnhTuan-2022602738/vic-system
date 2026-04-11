import re
import random
from app.core.logger import logger
from app.domain.news_analysis.sentiment_engine import analyze_sentiment
from app.domain.news_analysis.llm_loader import check_ollama_health

class SentimentAnalyzer:
    """Phân tích cảm xúc tin tức (Hybrid: LLM + Keywords)."""
    
    def __init__(self):
        # Bộ từ khóa dự phòng (Fallback Layer)
        self.positive_keywords = [
            "tăng", "kỷ lục", "thành công", "lợi nhuận", "mở rộng", 
            "niêm yết", "mua", "tốt", "đạt", "vượt", "xanh", "thuận lợi"
        ]
        self.negative_keywords = [
            "giảm", "áp lực", "thua lỗ", "cạnh tranh", "khó khăn", 
            "chốt lời", "bán", "thấp", "giảm sụt", "rủi ro", "đỏ"
        ]
        # Bộ nhớ đệm cho kết quả LLM (Headline -> Score)
        self._sentiment_cache = {}

    def analyze_text_keywords(self, text):
        """Phân tích cảm xúc dựa trên từ khóa (Phương án dự phòng)."""
        text = text.lower()
        score = 0
        for kw in self.positive_keywords:
            if kw in text: score += 0.2
        for kw in self.negative_keywords:
            if kw in text: score -= 0.2
        return max(-1.0, min(1.0, score))

    def analyze_news_list(self, news_items):
        """Phân tích danh sách tin tức bằng LLM (Ưu tiên) hoặc Keywords (Dự phòng)."""
        if not news_items:
            return 0.0, 0.15, [] # Mặc định impact 0.15 nếu không có tin
            
        # Kiểm tra "sức khỏe" của AI Engine (Ollama)
        is_llm_ready = check_ollama_health()
        if is_llm_ready:
            logger.info("[SentimentAnalyzer] 🤖 Đang sử dụng REAL AI (Ollama) để phân tích sắc thái...")
        else:
            logger.warning("[SentimentAnalyzer] ⚠️ Ollama chưa sẵn sàng. Đang sử dụng bộ lọc Từ khóa dự phòng...")

        analyzed_items = []
        total_weighted_score = 0.0
        total_impact = 0.0
        llm_count = 0 # Giới hạn số bài gọi AI mỗi lượt (để tránh timeout)
        
        for item in news_items:
            title = item.get("title", "")
            # 1. Kiểm tra cache
            if title in self._sentiment_cache:
                score = self._sentiment_cache[title]
            # 2. Gọi AI nếu chưa đủ Quota (Max 5 tin mới mỗi lần)
            elif is_llm_ready and llm_count < 5:
                try:
                    score = analyze_sentiment(title)
                    self._sentiment_cache[title] = score
                    llm_count += 1
                except Exception as e:
                    logger.warning(f"[SentimentAnalyzer] AI lỗi: {e}. Dùng Keywords.")
                    score = self.analyze_text_keywords(title)
            # 3. Dùng Keywords cho số còn lại để bay cho nhanh
            else:
                score = self.analyze_text_keywords(title)
                
            # Tính toán trọng số tác động (Impact)
            impact = 0.3 + (abs(score) * 0.5) 
            
            # Đảm bảo đủ các trường cho Pydantic Schema (Gia cố dữ liệu)
            analyzed_item = {
                "id": str(item.get("id", f"news_{random.randint(1000, 9999)}")),
                "title": str(item.get("title", "Tin tức không tiêu đề")),
                "sentiment_score": float(round(score, 2)),
                "impact_weight": float(round(impact, 2)),
                "source": str(item.get("source", "CafeF")),
                "timestamp": str(item.get("timestamp", "")),
                "url": str(item.get("url", "#"))
            }
            analyzed_items.append(analyzed_item)
            total_weighted_score += score * impact
            total_impact += impact
            
        avg_score = total_weighted_score / total_impact if total_impact > 0 else 0.0
        avg_impact = total_impact / len(news_items) if news_items else 0.0
        
        return float(round(avg_score, 4)), float(round(avg_impact, 4)), analyzed_items

