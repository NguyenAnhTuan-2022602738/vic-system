import feedparser
import requests
from bs4 import BeautifulSoup
import sys

# Ensure utf-8 output avoiding charmap error
sys.stdout.reconfigure(encoding='utf-8')

feed = feedparser.parse('https://cafef.vn/thi-truong-chung-khoan.rss')
entry = feed.entries[0]
url = entry.link
print("Link:", url)
res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(res.content, 'html.parser')

pdate = soup.find('span', {'data-role': 'publishdate'}) or soup.find(class_='pdate')
meta = soup.find('meta', property='article:published_time')

print("SPAN text:", pdate.text.strip() if pdate else "None")
if pdate:
    print("SPAN HTML:", str(pdate))
print("META content:", meta.get('content') if meta else "None")
print("RSS PubDate:", entry.get('published', 'None'))
print("RSS Parsed:", entry.get('published_parsed', 'None'))
