import asyncio
import argparse
from datetime import datetime
import time
from concurrent.futures import ThreadPoolExecutor

from app.core.logger import logger
from app.core.config import settings
from app.domain.news_analysis.news_scraper import RSS_SOURCES, KEYWORDS, fetch_news_from_rss
from app.domain.news_analysis.sentiment_engine import analyze_sentiment
from app.infrastructure.mongodb import mongodb
from app.infrastructure.news_repository import NewsRepository
from app.domain.news_analysis.historical_news_scraper import HistoricalNewsScraper

class SuperScraper:
    """
    Siêu Robot Cào Tin: Kết hợp RSS, Search và Phân tích AI đa tầng.
    Tự động lưu trữ vào MongoDB.
    """
    
    def __init__(self):
        self.repo = NewsRepository()
        self.executor = ThreadPoolExecutor(max_workers=2) # Giảm worker để tránh quá tải Ollama

    async def run_rss_crawl(self):
        """Cào tin tức nhanh từ các nguồn RSS."""
        logger.info("🚀 Bắt đầu chu kỳ cào tin RSS nhanh...")
        articles = fetch_news_from_rss(limit=50)
        
        # Phân tích sentiment cho tin mới
        for art in articles:
            try:
                # Phân tích sâu: Tiêu đề + Nội dung
                res = analyze_sentiment(art["title"], art.get("content", ""))
                art["sentiment_score"] = res["sentiment"]
                art["reasoning"] = res["reasoning"]
                art["category"] = res["category"]
                art["impact_score"] = res["impact_score"]
            except Exception as e:
                logger.warning(f"⚠️ Lỗi AI cho tin RSS: {e}")
                art["sentiment_score"] = 0.0
                art["reasoning"] = "Không thể phân tích nội dung chi tiết."
            
        await self.repo.save_news(articles)
        logger.info(f"✅ Đã xử lý xong {len(articles)} bản tin RSS.")

    async def search_and_scrape(self, query: str, category: str, pages: int = 3):
        """Tìm kiếm chuyên sâu theo từ khóa trên các trang báo."""
        logger.info(f"🔍 Đang tìm kiếm cho từ khóa: '{query}' (Nhóm: {category})...")
        
        scraper = HistoricalNewsScraper(ticker=query)
        
        all_found = []
        for p in range(1, pages + 1):
            articles = scraper.fetch_by_date(datetime.now().strftime("%Y-%m-%d"), max_pages=1)
            if not articles: break
            
            for art in articles:
                art["category"] = category
                art["trust_score"] = settings.SOURCE_TRUST_LEVELS.get("CafeF", 0.8)
                
                try:
                    # Phân tích Ripple Effect AI
                    art["sentiment_score"] = analyze_sentiment(art["title"])
                except Exception as e:
                    logger.warning(f"⚠️ Lỗi AI cho tin Search: {e}")
                    art["sentiment_score"] = 0.0
                    
                all_found.append(art)
                
            time.sleep(2) # Tăng độ chờ để tránh bị chặn IP
            
        if all_found:
            await self.repo.save_news(all_found)
            logger.info(f"✨ Đã lưu {len(all_found)} tin chuyên sâu cho '{query}'.")

    async def run_full_scan(self, pages_per_kw: int = 2):
        """Chạy quét toàn diện tất cả các hạng mục tin tức."""
        start_time = time.time()
        logger.info("🔥 BẮT ĐẦU CHIẾN DỊCH CÀO TIN TOÀN CẦU 🔥")
        
        # 1. Quét RSS trước cho nhanh
        await self.run_rss_crawl()
        
        # 2. Quét chuyên sâu theo từng nhóm từ khóa
        tasks = []
        for category, keywords in KEYWORDS.items():
            # Chọn 2 từ khóa tiêu biểu nhất của mỗi nhóm để tránh spam
            for kw in keywords[:2]:
                tasks.append(self.search_and_scrape(kw, category, pages=pages_per_kw))
        
        await asyncio.gather(*tasks)
        
        duration = time.time() - start_time
        total_in_db = await self.repo.count_news()
        logger.info(f"🏁 CHIẾN DỊCH HOÀN TẤT. Tổng cộng kho tin: {total_in_db} bài. Thời gian: {duration:.1f}s")

async def main():
    parser = argparse.ArgumentParser(description="VIC Super Scraper Tool")
    parser.add_argument("--pages", type=int, default=2, help="Số trang kết quả tìm kiếm mỗi từ khóa")
    parser.add_argument("--mode", type=str, default="full", choices=["rss", "full"], help="Chế độ cào")
    
    args = parser.parse_args()
    
    # Khởi tạo DB
    mongodb.connect()
    
    scraper = SuperScraper()
    if args.mode == "rss":
        await scraper.run_rss_crawl()
    else:
        await scraper.run_full_scan(pages_per_kw=args.pages)

if __name__ == "__main__":
    asyncio.run(main())
