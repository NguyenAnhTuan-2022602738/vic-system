import random
import time
from datetime import datetime, timedelta, timezone
from app.core.logger import logger
from app.domain.sentiment.sentiment_analyzer import SentimentAnalyzer
from app.domain.news_analysis.news_scraper import fetch_news_from_rss
from app.domain.news_analysis.historical_news_scraper import HistoricalNewsScraper

class NewsService:
    """Dịch vụ cung cấp và phân tích tin tức thực tế liên quan đến VIC."""
    
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self._cache = {}
        self._cache_expiry = 300  # 5 phút (300 giây)

    def get_time_diff_string(self, published_at_str):
        """Tính toán khoảng cách thời gian so với hiện tại."""
        try:
            published_at = datetime.fromisoformat(published_at_str)
            # Đảm bảo cả hai đều là timezone-aware hoặc naive
            now = datetime.now()
            if published_at.tzinfo:
                now = datetime.now(timezone.utc)
            
            diff = now - published_at
            
            seconds = diff.total_seconds()
            if seconds < 60:
                return "vừa xong"
            elif seconds < 3600:
                return f"{int(seconds // 60)} phút trước"
            elif seconds < 86400:
                return f"{int(seconds // 3600)} giờ trước"
            else:
                return f"{int(seconds // 86400)} ngày trước"
        except Exception as e:
            logger.error(f"Lỗi khi tính time diff: {e}")
            return "vừa xong"

    def get_latest_news(self, limit=5):
        """Lấy danh sách tin tức thực tế từ RSS."""
        articles = fetch_news_from_rss(limit=limit)
        
        news_items = []
        for i, art in enumerate(articles):
            news_items.append({
                "id": f"news_{int(time.time())}_{i}",
                "title": art["title"],
                "source": art["source"],
                "timestamp": art["published_at"],
                "time_display": self.get_time_diff_string(art["published_at"]),
                "url": art["url"]
            })
            
        return news_items

    def fetch_and_analyze(self, limit=5, force_refresh=False):
        """Lấy tin tức thực tế và tự động phân tích cảm xúc (Có cache)."""
        cache_key = f"latest_news_{limit}"
        now = time.time()
        
        # Kiểm tra cache
        if not force_refresh and cache_key in self._cache:
            cache_data, timestamp = self._cache[cache_key]
            if now - timestamp < self._cache_expiry:
                logger.info(f"[NewsService] Trả về news từ Cache ({int(now - timestamp)}s trước)")
                return cache_data
        
        # Nếu không có hoặc hết hạn mới đi cào tin
        if force_refresh:
            logger.info(f"[NewsService] Ép cào tin mới theo yêu cầu (limit: {limit})...")
        else:
            logger.info(f"[NewsService] Cache hết hạn hoặc trống, đang cào tin mới (limit: {limit})...")
        news_items = self.get_latest_news(limit)
        # Truyền danh sách news_items vào analyzer (Nhận 3 giá trị: score, impact, items)
        avg_score, avg_impact, analyzed_items = self.sentiment_analyzer.analyze_news_list(news_items)

        
        # Đảm bảo giữ lại field time_display sau khi phân tích
        for i, item in enumerate(analyzed_items):
            if i < len(news_items):
                item["time_display"] = news_items[i]["time_display"]
        
        # Lưu vào cache
        self._cache[cache_key] = (analyzed_items, now)
        return analyzed_items

    def analyze(self, text):
        """Phân tích một đoạn văn bản đơn lẻ."""
        score = self.sentiment_analyzer.analyze_text(text)
        return {
            "text": text,
            "sentiment_score": score,
            "label": "Tích cực" if score > 0.1 else "Tiêu cực" if score < -0.1 else "Trung tính"
        }

    def analyze_batch(self, articles):
        """Phân tích hàng loạt bài báo."""
        results = []
        for art in articles:
            results.append(self.analyze(art.get("title", "")))
        return results

    def backfill_historical_news(self, target_date: str):
        """
        Kéo bù tin tức lịch sử cho Dashboard (Flashback).
        1. Gọi Scraper để quét CafeF Search.
        2. Phân tích cảm xúc ngay lập tức.
        """
        scraper = HistoricalNewsScraper(ticker="VIC")
        # Kéo tối đa 3 trang kết quả để tìm đúng ngày
        articles = scraper.fetch_by_date(target_date, max_pages=3)
        
        if not articles:
            logger.info(f"ℹ️ Không tìm thấy tin tức cụ thể cho ngày {target_date} trên CafeF.")
            return []

        # Convert sang format news_items cho analyzer
        temp_items = []
        for i, art in enumerate(articles):
            temp_items.append({
                "id": f"hist_{target_date}_{i}",
                "title": art["title"],
                "source": art["source"],
                "timestamp": art["published_at"],
                "time_display": target_date,
                "url": art["url"]
            })

        # Phân tích cảm xúc hàng loạt (Nhận 3 giá trị: score, impact, items)
        avg_score, avg_impact, analyzed_items = self.sentiment_analyzer.analyze_news_list(temp_items)

        
        # Đồng bộ lại context cho Dashboard
        for i, item in enumerate(analyzed_items):
            item["time_display"] = target_date
            
        logger.info(f"✅ Đã phân tích xong {len(analyzed_items)} tin tức cũ cho ngày {target_date}.")
        return analyzed_items
