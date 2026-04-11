import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.news_service import NewsService

def test_news():
    service = NewsService()
    print("Fetching real-time news from RSS...")
    news = service.fetch_and_analyze(limit=3)
    
    for item in news:
        print("-" * 30)
        print(f"Title: {item['title']}")
        print(f"Source: {item['source']}")
        print(f"Time: {item['timestamp']}")
        print(f"Display: {item['time_display']}")
        print(f"Sentiment: {item['sentiment_score']}")

if __name__ == "__main__":
    test_news()
