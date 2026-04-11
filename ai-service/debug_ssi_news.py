import requests
import json

def debug_ssi_news():
    ticker = "VIC"
    # SSI News API URL (Lấy tin CafeF, Vietstock...)
    url = f"https://iboard-query.ssi.com.vn/stock/news/{ticker}"
    params = {
        "page": 1,
        "size": 20
    }
    
    print(f"🕵️‍♂️ Robot đang thâm nhập SSI News API cho mã {ticker}...")
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            items = data.get('data', {}).get('items', [])
            print(f"✅ Thành công! Tìm thấy {len(items)} tin tức.")
            
            for i, item in enumerate(items[:5]):
                print(f"  [{i+1}] Title: {item.get('title')}")
                print(f"      Date: {item.get('publishDate')}")
                print(f"      Source: {item.get('organ')}") # Thường là CafeF
                print(f"      URL: {item.get('url')}")
        else:
            print(f"❌ Thất bại: {response.text}")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    debug_ssi_news()
