import feedparser
import time
from datetime import datetime

url = 'https://cafef.vn/thi-truong-chung-khoan.rss'
feed = feedparser.parse(url)

if not feed.entries:
    print("No entries found")
else:
    entry = feed.entries[0]
    print(f"Title: {entry.title}")
    print(f"Published (raw): {entry.get('published')}")
    p = entry.get('published_parsed')
    print(f"Published_parsed: {p}")
    if p:
        # mktime uses local time
        ts = time.mktime(p)
        print(f"Timestamp (local): {ts}")
        print(f"ISO (local): {datetime.fromtimestamp(ts).isoformat()}")
        
        # gmtime conversion
        import calendar
        ts_utc = calendar.timegm(p)
        print(f"Timestamp (UTC): {ts_utc}")
        print(f"ISO (UTC): {datetime.fromtimestamp(ts_utc).isoformat()}")
