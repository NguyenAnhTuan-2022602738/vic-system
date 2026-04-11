from vnstock3 import Vnstock
import pandas as pd

def test_vnstock():
    sources = ["TCBS", "SSI", "DNSE", "VCI"]
    print(f"Testing vnstock sources...")
    
    for s in sources:
        try:
            print(f"Testing {s}...")
            stock = Vnstock().stock(symbol="VIC", source=s)
            df = stock.quote.history(start="2024-03-01", end="2024-03-20")
            if df is not None and not df.empty:
                print(f"✅ {s} works! Data shape: {df.shape}")
                print(df.head())
                return
            else:
                print(f"❌ {s} returned empty.")
        except Exception as e:
            print(f"❌ {s} failed: {e}")

if __name__ == "__main__":
    test_vnstock()
