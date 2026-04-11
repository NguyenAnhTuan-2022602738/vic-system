import requests

def dump():
    url = "https://cafef.vn/tim-kiem.chn?keywords=VIC"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    print(f"🕵️‍♂️ Đang trích xuất: {url}...")
    try:
        r = requests.get(url, headers=headers, timeout=10)
        with open("cafef_dump.html", "w", encoding="utf-8") as f:
            f.write(r.text)
        print(f"✅ Đã dump {len(r.text)} ký tự vào file cafef_dump.html (Status: {r.status_code})")
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    dump()
