"""
Lấy dữ liệu cổ phiếu VIC (Vingroup) từ vnstock.
Lưu OHLCV thô vào data/raw/ và đặc trưng đã xử lý vào data/processed/.
"""

import os
import sys
import pandas as pd
from datetime import datetime

# Thêm thư mục ai-service vào PATH
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ai-service"))


def fetch_vic_data(
    start_date: str = "2015-01-01",
    end_date: str = "2025-12-31",
    output_dir: str = "data",
) -> pd.DataFrame:
    """
    Lấy dữ liệu lịch sử cổ phiếu VIC qua vnstock.

    Tham số:
        start_date: Ngày bắt đầu (YYYY-MM-DD)
        end_date: Ngày kết thúc
        output_dir: Thư mục đầu ra

    Trả về:
        DataFrame với dữ liệu OHLCV
    """
    # Dùng vnstock (không phải vnstock3) — ít API call hơn, không bị rate limit
    from vnstock import Vnstock

    print(f"Dang lay du lieu VIC tu {start_date} den {end_date}...")

    # Khởi tạo kết nối — source VCI giống code gốc của user
    stock = Vnstock().stock(symbol="VIC", source="VCI")

    # Lấy dữ liệu OHLCV theo ngày
    df = stock.quote.history(start=start_date, end=end_date, interval="1D")

    print(f"  Thanh cong! {len(df)} dong du lieu")

    # Chuẩn hóa tên cột
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]

    rename_map = {}
    for col in df.columns:
        if "time" in col or "date" in col:
            rename_map[col] = "date"
        elif col == "open":
            rename_map[col] = "open"
        elif col == "high":
            rename_map[col] = "high"
        elif col == "low":
            rename_map[col] = "low"
        elif col == "close":
            rename_map[col] = "close"
        elif "vol" in col and "volume" not in rename_map.values():
            rename_map[col] = "volume"

    df = df.rename(columns=rename_map)

    # Sắp xếp theo ngày
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)

    # Chỉ giữ cột OHLCV
    keep = [c for c in ["date", "open", "high", "low", "close", "volume"] if c in df.columns]
    df = df[keep]

    # Lưu dữ liệu thô
    raw_dir = os.path.join(output_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    raw_path = os.path.join(raw_dir, "vic_price.csv")
    df.to_csv(raw_path, index=False)
    print(f"  Da luu du lieu tho: {raw_path} ({len(df)} dong)")

    return df


def process_features(df: pd.DataFrame, output_dir: str = "data") -> pd.DataFrame:
    """
    Tính chỉ báo kỹ thuật và lưu đặc trưng đã xử lý.
    """
    from app.domain.forecasting.feature_builder import build_features

    print("Dang tinh chi bao ky thuat...")
    df_features = build_features(df)

    proc_dir = os.path.join(output_dir, "processed")
    os.makedirs(proc_dir, exist_ok=True)
    proc_path = os.path.join(proc_dir, "vic_features.csv")
    df_features.to_csv(proc_path, index=False)
    print(f"  Da luu dac trung: {proc_path} ({len(df_features)} dong)")
    print(f"  Cac cot: {list(df_features.columns)}")

    return df_features


if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)

    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)

    df = fetch_vic_data()

    try:
        df_features = process_features(df)
        print(f"\nHoan thanh! Du lieu san sang de train model.")
        print(f"  Chay: cd ai-service && venv\\Scripts\\python scripts/train.py")
    except ImportError as e:
        print(f"Khong the import feature_builder: {e}")
        print("  Du lieu tho da luu. Chay feature processing rieng.")
