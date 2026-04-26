import feedparser
import time
from datetime import datetime, timezone

url = "https://cafef.vn/thi-truong-chung-khoan.rss"
feed = feedparser.parse(url)

print(f"Feed Title: {feed.feed.get('title')}")
print("-" * 50)

for entry in feed.entries[:3]:
    print(f"Entry: {entry.get('title')[:30]}...")
    print(f"Published (raw): {entry.get('published')}")
    print(f"Published_parsed: {entry.get('published_parsed')}")
    
    # Test current logic
    if hasattr(entry, 'published_parsed'):
        import calendar
        ts = calendar.timegm(entry.published_parsed)
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        print(f"Processed (UTC): {dt.isoformat()}")
    
    print("-" * 30)
