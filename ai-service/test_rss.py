import feedparser
import time

RSS_SOURCES = [
    {"name": "CafeF", "url": "https://cafef.vn/thi-truong-chung-khoan.rss"},
]

def test():
    for source in RSS_SOURCES:
        print(f"--- Testing {source['name']} ---")
        feed = feedparser.parse(source["url"])
        print(f"Entries found: {len(feed.entries)}")
        if len(feed.entries) > 0:
            for i in range(min(2, len(feed.entries))):
                print(f"  [{i}] Title: {feed.entries[i].title[:50]}...")
        print("\n")

if __name__ == "__main__":
    test()
