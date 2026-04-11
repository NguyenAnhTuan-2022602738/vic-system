import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import re
from app.core.logger import logger

class HistoricalNewsScraper:
    """
    Robot chuyên dụng để cào tin tức cũ từ CafeF (Backfill).
    Sử dụng kỹ thuật nhận diện linh hoạt dựa trên cấu trúc thực tế của CafeF Search.
    """
    
    BASE_URL = "https://cafef.vn"
    SEARCH_PATH = "/tim-kiem.chn?keywords={ticker}&trang={page}"
    
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    def __init__(self, ticker="VIC"):
        self.ticker = ticker

    def fetch_by_date(self, target_date_str: str, max_pages: int = 5) -> list[dict]:
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            logger.error(f"Invalid date format: {target_date_str}")
            return []

        results = []
        logger.info(f"🕵️‍♂️ Robot đang lùng sục tin tức ngày {target_date_str} cho mã {self.ticker}...")

        for page in range(1, max_pages + 1):
            url = f"{self.BASE_URL}{self.SEARCH_PATH.format(ticker=self.ticker, page=page)}"
            
            try:
                response = requests.get(url, headers=self.HEADERS, timeout=15)
                if response.status_code != 200:
                    break
                
                soup = BeautifulSoup(response.content, "html.parser")
                # CafeF Search items: div.item hoặc li
                news_items = soup.find_all(["div", "li"], class_="item")
                if not news_items:
                    # Fallback tìm h3 trực tiếp
                    news_items = [tag.parent for tag in soup.find_all("h3")]

                found_older = False
                for item in news_items:
                    try:
                        title_tag = item.find("h3") or item.find("a", class_="title")
                        if not title_tag: continue
                        
                        a_tag = title_tag.find("a") if title_tag.name == "h3" else title_tag
                        if not a_tag: continue

                        title = a_tag.get_text(strip=True)
                        link = a_tag.get("href", "")
                        if not link.startswith("http"):
                            link = f"{self.BASE_URL}{link}"
                            
                        # Dùng Regex tìm ngày tháng DD/MM/YYYY trong toàn bộ container
                        item_text = item.get_text(" ", strip=True)
                        date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', item_text)
                        
                        if not date_match: continue
                        
                        date_str = date_match.group(1)
                        article_date = datetime.strptime(date_str, "%d/%m/%Y").date()

                        if article_date == target_date:
                            # Tránh tin trùng lặp trong cùng 1 lần quét
                            if not any(r['url'] == link for r in results):
                                results.append({
                                    "title": title,
                                    "url": link,
                                    "published_at": datetime.combine(article_date, datetime.min.time()).isoformat(),
                                    "source": "CafeF (Archive)",
                                    "content": item.find(class_="sapo").get_text(strip=True) if item.find(class_="sapo") else title
                                })
                        elif article_date < target_date:
                            # Đã quét qua ngày yêu cầu
                            found_older = True
                    except Exception as e:
                        continue
                
                if found_older and len(results) > 0:
                    break
                
                time.sleep(1)
            except Exception as e:
                break

        logger.info(f"🎯 Robot đã mang về {len(results)} tin tức cho ngày {target_date_str}!")
        return results
