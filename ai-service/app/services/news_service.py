import random
import time
from datetime import datetime, timedelta, timezone
from app.core.logger import logger
from app.domain.sentiment.sentiment_analyzer import SentimentAnalyzer
from app.domain.news_analysis.news_scraper import fetch_news_from_rss
from app.domain.news_analysis.historical_news_scraper import HistoricalNewsScraper
from app.infrastructure.news_repository import NewsRepository

class NewsService:
    """Dịch vụ cung cấp và phân tích tin tức thực tế liên quan đến VIC."""
    
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.news_repo = NewsRepository()
        self._cache = {}
        self._cache_expiry = 300  # 5 phút (300 giây)

    def get_time_diff_string(self, published_at_str):
        """Tính toán khoảng cách thời gian so với hiện tại, đồng bộ Timezone."""
        if not published_at_str:
            return "vừa xong"
        try:
            # Chấp nhận ISO format có Z hoặc offset
            iso_str = published_at_str.replace('Z', '+00:00')
            published_at = datetime.fromisoformat(iso_str)
            
            # Đảm bảo aware
            if published_at.tzinfo is None:
                # Nếu không có múi giờ, giả định là UTC
                published_at = published_at.replace(tzinfo=timezone.utc)
            else:
                # Chuyển về UTC để tính toán
                published_at = published_at.astimezone(timezone.utc)
                
            now = datetime.now(timezone.utc)
            diff = now - published_at
            
            seconds = diff.total_seconds()
            
            # Nếu tin mới (dưới 1 phút) hoặc lệch nhẹ do clock
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
        """Lấy danh sách tin tức thực tế từ RSS (Dự phòng)."""
        articles = fetch_news_from_rss(limit=limit)
        
        news_items = []
        for i, art in enumerate(articles):
            news_items.append({
                "id": f"news_{int(time.time())}_{i}",
                "title": art["title"],
                "source": art["source"],
                "category": art.get("category", "Market"),
                "trust_score": art.get("trust_score", 0.7),
                "published_at": art["published_at"],
                "time_display": self.get_time_diff_string(art["published_at"]),
                "url": art["url"]
            })
            
        return news_items

    def fetch_and_analyze(self, limit=5, page=1, force_refresh=False, hours_limit=None):
        """Lấy tin tức thực tế và tự động phân tích cảm xúc (Hỗ trợ Phân trang)."""
        cache_key = f"latest_news_{limit}_{page}_{hours_limit}"
        now_ts = time.time()
        
        # ... (Cache handling remains similar, but using the new key)
        if not force_refresh and cache_key in self._cache:
            cache_data, timestamp = self._cache[cache_key]
            if now_ts - timestamp < self._cache_expiry:
                logger.info(f"[NewsService] Trả về news từ Cache ({int(now_ts - timestamp)}s trước)")
                return cache_data
        
        news_items = []
        total_count = 0
        
        if force_refresh:
            logger.info(f"[NewsService] Ép cào tin mới từ RSS (limit: {limit})...")
            news_items = self.get_latest_news(limit)
            total_count = len(news_items)
        else:
            logger.info(f"[NewsService] Truy xuất tin tức từ DB (Page: {page}, limit: {limit})...")
            import asyncio
            try:
                # Cách gọi async an toàn hơn trong FastAPI/Uvicorn
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                async def get_db_news():
                    # Thử lấy tin theo filter (Repository giờ trả về tuple: items, total)
                    items, total = await self.news_repo.get_latest_news(limit=limit, page=page, hours_limit=hours_limit)
                    
                    # FALLBACK: Nếu lọc theo giờ không có, lấy tin mới nhất bất kể thời gian
                    if not items and hours_limit is not None:
                        logger.info(f"[NewsService] Fallback: Không có tin trong {hours_limit}h qua, lấy tin cũ hơn từ DB...")
                        items, total = await self.news_repo.get_latest_news(limit=limit, page=page, hours_limit=None)
                    return items, total

                if loop.is_running():
                    import nest_asyncio
                    nest_asyncio.apply()
                    news_items, total_count = loop.run_until_complete(get_db_news())
                else:
                    news_items, total_count = asyncio.run(get_db_news())

            except Exception as e:
                logger.error(f"[NewsService] Lỗi truy xuất DB: {e}")
                news_items = []
                total_count = 0
                
            if not news_items and not hours_limit and page == 1:
                 logger.warning("[NewsService] DB hoàn toàn trống. Yêu cầu cào tin ban đầu...")
                 news_items = self.get_latest_news(limit)
                 total_count = len(news_items)
                 
        # Phân tích cảm xúc
        avg_score, avg_impact, analyzed_items = self.sentiment_analyzer.analyze_news_list(news_items)

        for item in analyzed_items:
            pub_date = item.get("published_at")
            item["time_display"] = self.get_time_diff_string(pub_date) if pub_date else "vừa xong"
            item["timestamp"] = pub_date if pub_date else datetime.now(timezone.utc).isoformat()
        
        # Lưu kết quả
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            loop.run_until_complete(self.news_repo.save_news(analyzed_items))
        except Exception as e:
            logger.error(f"[NewsService] Lỗi tự động lưu phân tích: {e}")

        result = {
            "news": analyzed_items,
            "total_count": total_count,
            "page": page,
            "limit": limit
        }
        
        # Lưu vào cache in-memory
        self._cache[cache_key] = (result, now_ts)
        return result

    def analyze(self, title: str, content: str = ""):
        """Phân tích một đoạn văn bản đơn lẻ (Tiêu đề + Nội dung)."""
        res = self.sentiment_analyzer.analyze_sentiment(title, content)
        score = res["sentiment"]
        return {
            "title": title,
            "sentiment_score": score,
            "reasoning": res["reasoning"],
            "category": res["category"],
            "label": "Tích cực" if score > 0.1 else "Tiêu cực" if score < -0.1 else "Trung tính"
        }

    def analyze_batch(self, articles: list[dict]):
        """Phân tích hàng loạt bài báo."""
        results = []
        for art in articles:
            results.append(self.analyze(art.get("title", ""), art.get("content", "")))
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
