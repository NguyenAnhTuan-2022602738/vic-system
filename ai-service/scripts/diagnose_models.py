import asyncio
from app.services.forecast_service import ForecastService
from app.core.logger import logger
import pandas as pd
import numpy as np

async def diagnose_models():
    logger.info("🚀 Bắt đầu chẩn đoán so sánh đa mô hình...")
    service = ForecastService()
    
    # Giới hạn 2 ngày dự báo (Horizon = 2)
    horizon = 2
    result = service.predict(horizon=horizon, force_refresh=True)
    
    print("\n" + "="*50)
    print(f"BÁO CÁO CHẨN ĐOÁN MÔ HÌNH (Horizon: {horizon} ngày)")
    print("="*50)
    
    comparison = result.get("comparison", [])
    
    for m in comparison:
        name = m['name']
        ret = m['expected_return']
        mae = m['mae']
        print(f"\n🔹 Mô hình: {name}")
        print(f"   - Lợi nhuận kỳ vọng: {ret:+.4%}")
        print(f"   - Độ lỗi (MAE): {mae:.4f}")
        
        if "LSTM" in name:
            print(f"   - Đặc điểm: Sử dụng chuỗi 60 phiên + Sentiment ({result.get('sentiment_score'):.2f})")
        elif "Random Forest" in name:
            print(f"   - Đặc điểm: Phi tuyến tính, tập trung vào các ngưỡng hỗ trợ/kháng cự kỹ thuật.")
        else:
            print(f"   - Đặc điểm: Tuyến tính, dùng làm mốc so sánh cơ bản (Baseline).")

    print("\n" + "="*50)
    print("PHÂN TÍCH LÝ DO LỆCH TỪ AI:")
    
    # Tính toán độ lệch
    returns = [m['expected_return'] for m in comparison]
    std_dev = np.std(returns)
    max_diff = max(returns) - min(returns)
    
    print(f"1. Độ lệch chuẩn (Volatility of Models): {std_dev:.6f}")
    print(f"2. Khoảng cách lớn nhất (Max spread): {max_diff:.4%}")
    
    print("\n3. Kết luận nguyên nhân:")
    if abs(result.get('sentiment_score', 0)) > 0.2:
        print("   👉 TIN TỨC ĐANG TÁC ĐỘNG: LSTM có 'News Fusion' nên kết quả sẽ khác biệt rõ rệt so với 2 mô hình thuần kỹ thuật còn lại.")
    
    if max_diff > 0.02:
        print("   👉 BIẾN ĐỘNG MẠNH: Thị trường đang có dấu hiệu phân cực, mô hình LSTM (Attention) đang bắt được các phiên 'bất thường' mà RF/LR bỏ qua.")
    else:
        print("   👉 ỔN ĐỊNH: Các mô hình đang khá đồng thuận về xu hướng.")
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(diagnose_models())
