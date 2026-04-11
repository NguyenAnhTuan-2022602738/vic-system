import requests
import json

def test_backfill():
    url = "http://localhost:8000/api/v1/news/backfill"
    payload = {
        "target_date": "2024-03-22" # Chọn một ngày cụ thể trong năm 2024 để test tin cũ
    }
    
    print(f"🚀 Gửi lệnh Backfill cho ngày: {payload['target_date']}...")
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Thành công! Robot đã mang về {result.get('count', 0)} tin tức.")
            for i, item in enumerate(result.get('data', [])[:3]):
                print(f"  [{i+1}] {item['title']} ({item['source']})")
        else:
            print(f"❌ Thất bại: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")

if __name__ == "__main__":
    test_backfill()
