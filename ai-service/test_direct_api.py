import requests
import datetime
import time

def test_direct_api():
    symbol = "VIC"
    # To date: now
    to_date = int(time.time())
    # From date: 1 year ago
    from_date = to_date - (365 * 24 * 60 * 60)
    
    # Một số API công khai thường dùng
    urls = [
        f"https://api.vietstock.vn/ta/history?symbol={symbol}&from={from_date}&to={to_date}&resolution=D",
        "https://api.cafef.vn/api/TradeService/GetHistoryTrade" # Cần POST
    ]
    
    print(f"Testing direct API for {symbol}...")
    
    try:
        r = requests.get(urls[0], timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "t" in data:
                print(f"✅ Vietstock API works! Sample: {data['c'][:5]}")
                return
        print(f"❌ Vietstock failed ({r.status_code})")
    except Exception as e:
        print(f"❌ Vietstock error: {e}")

if __name__ == "__main__":
    test_direct_api()
