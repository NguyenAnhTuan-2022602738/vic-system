import pandas as pd
import os
import time

CSV_PATH = r"c:\Users\cuida\Documents\DATN\vic-system\ai-service\data\raw\vic_price.csv"

def test_load():
    print(f"DEBUG: Checking {CSV_PATH}")
    if os.path.exists(CSV_PATH):
        print("DEBUG: File exists. Reading...")
        start = time.time()
        df = pd.read_csv(CSV_PATH)
        print(f"DEBUG: Read successfully in {time.time() - start:.4f}s. Rows: {len(df)}")
    else:
        print("DEBUG: File NOT found.")

if __name__ == "__main__":
    test_load()
