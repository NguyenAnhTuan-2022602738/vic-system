import sys
import os
# Thêm đường dẫn để import được app.domain
sys.path.append(os.getcwd())

from app.domain.news_analysis.historical_news_scraper import HistoricalNewsScraper
import logging

# Bật log để soi
logging.basicConfig(level=logging.INFO)

def test_scraper():
    ticker = "VIC"
    # Thử một ngày gần đây mà CafeF chắc chắn có tin về VIC
    target_date = "2026-04-01" 
    
    scraper = HistoricalNewsScraper(ticker=ticker)
    print(f"🕵️‍♂️ Robot xuất phát lùng sục tin VIC ngày {target_date}...")
    
    # Quét thử Trang 1 đến Trang 10 để đảm bảo tìm thấy
    results = scraper.fetch_by_date(target_date, max_pages=10)
    
    print("\n" + "="*50)
    print(f"🎯 KẾT QUẢ: Robot đã mang về {len(results)} tin.")
    for i, res in enumerate(results):
        print(f"  [{i+1}] {res['title']} | {res['published_at']}")
    print("="*50)

if __name__ == "__main__":
    test_scraper()
