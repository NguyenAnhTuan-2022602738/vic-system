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
        """Phân tích danh sách tin tức với trọng số đa tầng (Trust + Category + Time Decay)."""
        from app.core.config import settings
        from datetime import datetime, timezone
        import math
        
        if not news_items:
            return 0.0, 0.15, []
            
        is_llm_ready = check_ollama_health()
        now = datetime.now(timezone.utc)
        
        analyzed_items = []
        total_weighted_score = 0.0
        total_impact_sum = 0.0
        llm_count = 0
        
        for item in news_items:
            title = item.get("title", "")
            content = item.get("full_content") or item.get("content", "")
            category = item.get("category", "Market")
            trust_score = item.get("trust_score", 0.7)
            reasoning = item.get("reasoning", "")
            
            # 1. Lấy Sentiment Score (Ưu tiên điểm đã có trong DB)
            if "sentiment_score" in item and item["sentiment_score"] is not None:
                score = float(item["sentiment_score"])
                reasoning = item.get("reasoning", "Dữ liệu đã được phân tích trước đó.")
            elif title in self._sentiment_cache:
                cached = self._sentiment_cache[title]
                score = cached["sentiment"]
                reasoning = cached["reasoning"]
            elif is_llm_ready and llm_count < 20: # Tăng lên 20 tin mỗi đợt
                try:
                    res = analyze_sentiment(title, content)
                    score = res["sentiment"]
                    reasoning = res["reasoning"]
                    # Cập nhật thêm category và impact_score nếu AI gợi ý tốt hơn
                    if res.get("category"): category = res["category"]
                    
                    self._sentiment_cache[title] = res
                    llm_count += 1
                except Exception as e:
                    logger.warning(f"[SentimentAnalyzer] AI lỗi: {e}")
                    score = self.analyze_text_keywords(title)
                    reasoning = "Phân tích dự phòng bằng từ khóa."
            else:
                score = self.analyze_text_keywords(title)
                reasoning = "Phân tích dự phòng bằng từ khóa."
                
            # 2. Tính toán Time Decay Factor
            try:
                pub_date_str = item.get("published_at")
                if pub_date_str:
                    pub_date = datetime.fromisoformat(pub_date_str.replace('Z', '+00:00'))
                    if pub_date.tzinfo is None:
                        pub_date = pub_date.replace(tzinfo=timezone.utc)
                        
                    delta = now - pub_date
                    hours_ago = max(0, delta.total_seconds() / 3600)
                    time_decay = math.exp(-0.03 * hours_ago)
                else:
                    time_decay = 0.5
            except Exception as e:
                logger.warning(f"Lỗi tính Time Decay: {e}")
                time_decay = 0.5

            # 3. Tính toán trọng số tổng hợp
            base_impact = 0.3 + (abs(score) * 0.5)
            cat_weight = settings.CATEGORY_WEIGHTS.get(category, 1.0)
            final_impact = base_impact * trust_score * cat_weight * time_decay
            
            analyzed_item = {
                "id": str(item.get("id", f"news_{random.randint(1000, 9999)}")),
                "title": title,
                "sentiment_score": float(round(score, 2)),
                "reasoning": reasoning,
                "impact_weight": float(round(final_impact, 2)),
                "category": category,
                "source": str(item.get("source", "CafeF")),
                "published_at": str(item.get("published_at", "")),
                "url": str(item.get("url", "#")),
                "full_content": content[:500] + "..." if len(content) > 500 else content
            }
            analyzed_items.append(analyzed_item)
            
            # Cộng dồn có trọng số
            total_weighted_score += score * final_impact
            total_impact_sum += final_impact
            
        avg_score = total_weighted_score / total_impact_sum if total_impact_sum > 0 else 0.0
        avg_impact = total_impact_sum / len(news_items) if news_items else 0.0
        
        return float(round(avg_score, 4)), float(round(avg_impact, 4)), analyzed_items

