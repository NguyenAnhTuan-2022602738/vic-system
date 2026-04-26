import feedparser
import sys

# Ensure utf-8 output manually if needed, or just avoid non-ascii
sys.stdout.reconfigure(encoding='utf-8')

url = "https://cafef.vn/thi-truong-chung-khoan.rss"
feed = feedparser.parse(url)

if not feed.entries:
    print("No entries found")
else:
    for i, entry in enumerate(feed.entries[:5]):
        print(f"Entry {i}:")
        print(f"  Title (raw): {entry.get('title').encode('ascii', 'ignore').decode()}")
        print(f"  Published (raw): {entry.get('published')}")
        print(f"  Published_parsed type: {type(entry.get('published_parsed'))}")
        print(f"  Published_parsed value: {entry.get('published_parsed')}")
        print("-" * 20)
