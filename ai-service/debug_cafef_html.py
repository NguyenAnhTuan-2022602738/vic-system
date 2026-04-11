import requests

def debug_html():
    url = "https://cafef.vn/tag/vic.chn"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"🕵️‍♂️ Đang thử đột nhập vào: {url}...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        h3s = soup.find_all('h3')
        print("\n--- SOI CẤU TRÚC BÀI BÁO CHI TIẾT ---")
        for h3 in h3s:
            if 'VIC' in h3.get_text(strip=True).upper():
                # Tìm container (thường là li hoặc div bao quanh)
                container = h3.parent
                print(f"Container Tag: {container.name}, Class: {container.get('class')}")
                print(f"H3 Class: {h3.get('class')}")
                # Tìm thẻ thời gian trong container
                time_tag = container.select_one('.time-ago') or container.select_one('.tm-ago') or container.find('span')
                print(f"Time Tag Found: {time_tag.name if time_tag else 'None'}, Text: {time_tag.get_text() if time_tag else 'None'}")
                print(f"Sample HTML: \n{container.prettify()[:500]}")
                break
        
        # Kiểm tra xem có chứa từ khóa 'VIC' không
        if "VIC" in response.text:
            print("\n✅ Tìm thấy từ khóa 'VIC' trong HTML!")
        else:
            print("\n❌ Không tìm thấy 'VIC' trong mã nguồn.")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    debug_html()
