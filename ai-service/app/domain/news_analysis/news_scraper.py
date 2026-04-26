import feedparser
import requests
import calendar
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from app.core.logger import logger

# Danh sách nguồn RSS đa dạng
RSS_SOURCES = [
    {"name": "CafeF", "url": "https://cafef.vn/thi-truong-chung-khoan.rss", "default_category": "Market"},
    {"name": "VnEconomy", "url": "https://vneconomy.vn/tai-chinh-ngan-hang.rss", "default_category": "Macro"},
    {"name": "Báo Đầu tư", "url": "https://baodautu.vn/dau-tu-tai-chinh.rss", "default_category": "Industry"},
    {"name": "Investing.com", "url": "https://vn.investing.com/rss/news_1065.rss", "default_category": "Market"},
    {"name": "Reuters", "url": "https://news.google.com/rss/search?q=when:24h+site:reuters.com", "default_category": "Global"},
]

# Từ khóa phân tầng tin tức (Hệ thống Trí tuệ Đa tầng)
KEYWORDS = {
    "Direct": ["VIC", "Vingroup", "Vinhomes", "Vincom", "VinFast", "Phạm Nhật Vượng", "VFS"],
    "Industry": ["Bất động sản", "Xe điện", "Ô tô", "Cạnh tranh", "Thị trường xe", "Pin xe điện", "Lithium"],
    "Macro": ["Lãi suất", "CPI", "Lạm phát", "Tỷ giá", "Ngân hàng Nhà nước", "VND", "Chính sách tiền tệ", "Đầu tư công"],
    "Global": ["Fed", "Mỹ", "Lãi suất Mỹ", "Nasdaq", "S&P 500", "Lạm phát Mỹ", "Kinh tế thế giới", "Trung Quốc", "Euro", "Yên Nhật"],
    "Geopolitical": ["Chiến tranh", "Xung đột", "Biển Đỏ", "Nga", "Ukraina", "Trung Đông", "Cấm vận", "Căng thẳng địa chính trị", "Giá dầu", "Xăng dầu", "Năng lượng", "Khủng hoảng"],
}

def extract_article_details(url: str) -> dict:
    """Truy cập link bài báo để lấy Full nội dung và Giờ phút chính xác."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return {}

        soup = BeautifulSoup(response.content, "html.parser")
        
        # 1. Lấy thời gian tuyệt đối (Ưu tiên meta tags chuyên dụng)
        published_at = None
        # Chuẩn og:published_time hoặc article:published_time
        meta_time = soup.find("meta", property="article:published_time") or \
                    soup.find("meta", property="og:published_time") or \
                    soup.find("meta", itemprop="datePublished")
        
        if meta_time:
            published_at = meta_time.get("content")
            
        # Fallback cho CafeF: <span class="pdate" data-role="publishdate">17-04-2026 - 00:07 AM</span>
        if not published_at:
            pdate_span = soup.find("span", {"data-role": "publishdate"}) or soup.find("span", class_="pdate")
            if pdate_span:
                raw_date = pdate_span.get_text(strip=True)
                try: # "17-04-2026 - 00:07 AM"
                    clean_date = raw_date.replace(" - ", " ").strip()
                    dt = datetime.strptime(clean_date, "%d-%m-%Y %I:%M %p")
                    # Gán timezone local (hoặc UTC tùy yêu cầu)
                    dt = dt.replace(tzinfo=timezone.utc) 
                    published_at = dt.isoformat()
                except Exception as e:
                    logger.warning(f"Lỗi parse ngày CafeF: {raw_date} -> {e}")

        # 2. Lấy nội dung chính (Lọc bỏ rác)
        content = ""
        # Danh sách các selector nội dung phổ biến của các báo Việt Nam
        content_selectors = [
            ".content_detail", "#main-content-detail", ".post-content", 
            ".detail-content", "#content_detail", ".article-content",
            "article", ".entry-content"
        ]
        
        for selector in content_selectors:
            div = soup.select_one(selector)
            if div:
                # Xóa các thành phần gây nhiễu
                for s in div.select("script, style, iframe, .sidebar, .ads, .comment"):
                    s.decompose()
                content = div.get_text(separator=" ", strip=True)
                if len(content) > 100: # Đảm bảo lấy được nội dung có nghĩa
                    break
                    
        return {
            "published_at": published_at,
            "full_content": content
        }
    except Exception as e:
        logger.warning(f"Lỗi khi Deep Scraping {url}: {e}")
        return {}

def fetch_news_from_rss(limit: int = 20) -> list[dict]:
    """Lấy tin từ RSS và bổ sung Deep Scraping cho từng bài báo."""
    all_articles = []
    
    for source in RSS_SOURCES:
        try:
            logger.info(f"Đang lấy tin từ {source['name']}...")
            response = requests.get(source["url"], timeout=10)
            if response.status_code != 200:
                continue
                
            feed = feedparser.parse(response.content)
            
            # Chỉ lấy tối đa 10 tin mới nhất mỗi nguồn để tránh crawl quá nhiều
            for entry in feed.entries[:10]:
                title = entry.title
                url = entry.link
                
                # Deep Scraping để lấy dữ liệu chất lượng cao
                details = extract_article_details(url)
                
                # Ưu tiên giờ từ HTML (chính xác hơn), fallback về RSS hoặc now
                published_at = details.get("published_at")
                if not published_at:
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        ts = calendar.timegm(entry.published_parsed)
                        published_at = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
                    else:
                        published_at = datetime.now(timezone.utc).isoformat()
                
                all_articles.append({
                    "title": title,
                    "content": details.get("full_content") or entry.get("summary", ""),
                    "source": source["name"],
                    "published_at": published_at,
                    "url": url,
                })
        except Exception as e:
            logger.error(f"Lỗi khi lấy tin từ {source['name']}: {e}")

    # Lọc tin liên quan đến VIC và thị trường
    relevant_articles = filter_relevant_news(all_articles)
    
    # Sắp xếp theo thời gian mới nhất
    relevant_articles.sort(key=lambda x: x["published_at"] if x["published_at"] else "", reverse=True)
    
    return relevant_articles[:limit]

def filter_relevant_news(articles: list[dict]) -> list[dict]:
    """Phân loại và lọc tin tức dựa trên từ khóa."""
    from app.core.config import settings
    
    relevant = []
    for article in articles:
        text = f"{article.get('title', '')} {article.get('content', '')}".lower()
        
        detected_category = None
        for category, kws in KEYWORDS.items():
            for kw in kws:
                if kw.lower() in text:
                    detected_category = category
                    break
            if detected_category:
                break
        
        if not detected_category:
            for src in RSS_SOURCES:
                if src["name"] == article["source"]:
                    detected_category = src.get("default_category", "Market")
                    break

        if detected_category:
            article["category"] = detected_category
            article["trust_score"] = settings.SOURCE_TRUST_LEVELS.get(article["source"], 0.7)
            relevant.append(article)
            
    return relevant
