import feedparser
import requests
from datetime import datetime
import time
from app.core.logger import logger

# Danh sách nguồn RSS uy tín (Tập trung vào CafeF để tránh trùng lặp)
RSS_SOURCES = [
    {"name": "CafeF", "url": "https://cafef.vn/thi-truong-chung-khoan.rss"},
]

# Danh sách từ khóa tìm kiếm tin tức VIC
VIC_KEYWORDS = [
    "VIC", "Vingroup", "Vinhomes", "Vincom",
    "VinFast", "Phạm Nhật Vượng",
]

def fetch_news_from_rss(limit: int = 10) -> list[dict]:
    """
    Lấy tin tức thực tế từ các nguồn RSS tiếng Việt.
    """
    all_articles = []
    
    for source in RSS_SOURCES:
        try:
            logger.info(f"Đang lấy tin từ {source['name']}...")
            feed = feedparser.parse(source["url"])
            
            for entry in feed.entries:
                # Parse thời gian sang ISO format
                published_at = datetime.now().isoformat()
                if hasattr(entry, 'published_parsed'):
                    published_at = datetime.fromtimestamp(time.mktime(entry.published_parsed)).isoformat()
                elif hasattr(entry, 'published'):
                    try:
                        # Thử parse chuỗi ngày tháng nếu không có struct_time
                        published_at = datetime.strptime(entry.published, '%a, %d %b %Y %H:%M:%S %z').isoformat()
                    except:
                        pass

                all_articles.append({
                    "title": entry.title,
                    "content": entry.get("summary", ""),
                    "source": source["name"],
                    "published_at": published_at,
                    "url": entry.link,
                })
        except Exception as e:
            logger.error(f"Lỗi khi lấy tin từ {source['name']}: {e}")

    # Lọc tin liên quan đến VIC
    relevant_articles = filter_relevant_news(all_articles)
    
    # Sắp xếp theo thời gian mới nhất
    relevant_articles.sort(key=lambda x: x["published_at"], reverse=True)
    
    return relevant_articles[:limit]


def filter_relevant_news(articles: list[dict]) -> list[dict]:
    """
    Lọc tin tức liên quan đến VIC/Vingroup.

    Tham số:
        articles: Danh sách bài tin tức

    Trả về:
        Danh sách bài tin có chứa từ khóa VIC
    """
    relevant = []
    for article in articles:
        text = f"{article.get('title', '')} {article.get('content', '')}".lower()
        for keyword in VIC_KEYWORDS:
            if keyword.lower() in text:
                relevant.append(article)
                break
    return relevant
