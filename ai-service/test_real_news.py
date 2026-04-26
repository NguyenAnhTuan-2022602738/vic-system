import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.news_service import NewsService

def test_news():
    service = NewsService()
    print("Fetching real-time news from RSS...")
    result = service.fetch_and_analyze(limit=3)
    news_list = result['news']
    print(f"Total found: {result['total_count']}")
    
    for item in news_list:
        print("-" * 30)
        print(f"Title: {item['title']}")
        print(f"Source: {item['source']}")
        print(f"Time: {item['timestamp']}")
        print(f"Display: {item.get('time_display', 'N/A')}")
        print(f"Sentiment: {item['sentiment_score']}")

if __name__ == "__main__":
    test_news()
