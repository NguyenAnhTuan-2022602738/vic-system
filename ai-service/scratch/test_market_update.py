import sys
import os
sys.path.append(os.getcwd())

from app.services.market_data_service import MarketDataService
from datetime import datetime

print(f"--- THỬ NGHIỆM CẬP NHẬT DỮ LIỆU ---")
print(f"Thời gian hiện tại: {datetime.now()}")

svc = MarketDataService()
print("Đang chạy update_csv_if_needed()...")
success = svc.update_csv_if_needed()

if success:
    print("✅ Cập nhật THÀNH CÔNG!")
else:
    print("❌ Không có dữ liệu mới hoặc cập nhật thất bại.")

# Đọc lại dòng cuối để kiểm chứng
import pandas as pd
df = pd.read_csv(svc.CSV_PATH)
print(f"Ngày cuối cùng trong CSV sau khi chạy: {df['date'].iloc[-1]}")
print(f"Giá đóng cửa: {df['close'].iloc[-1]}")
