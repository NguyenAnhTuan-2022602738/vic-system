import requests
import json
import numpy as np

BASE_URL = "http://localhost:8000/api/v1"

def check_market_history():
    print("[Test 1] Kiem tra Market History...")
    try:
        r = requests.get(f"{BASE_URL}/market/history", timeout=10)
        if r.status_code != 200:
            print(f"FAILED: Status code {r.status_code}")
            return False
            
        data = r.json()
        if not data.get("success"):
            print("FAILED: API returned success=False")
            return False
            
        history = data.get("data", [])
        if not history:
            print("FAILED: No history data found")
            return False
            
        # Kiểm tra NaN/Inf trong mẫu 5 phần tử cuối
        for item in history[-5:]:
            for key, val in item.items():
                if isinstance(val, (int, float)):
                    if np.isnan(val) or np.isinf(val):
                        print(f"FAILED: Found NaN/Inf in {key} at {item.get('date')}")
                        return False
        
        print(f"PASSED: Market History clean. Sample: {history[-1].get('close')} (Date: {history[-1].get('date')})")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def check_multi_horizon():
    print("\n[Test 2] Kiem tra Multi-horizon & 3 Models Comparison...")
    try:
        r = requests.get(f"{BASE_URL}/forecast/multi-horizon", timeout=15)
        if r.status_code != 200:
            print(f"FAILED: Status code {r.status_code}")
            return False
            
        data = r.json()
        horizons = data.get("data", {}).get("horizons", [])
        
        if not horizons:
            print("FAILED: No horizons data found")
            return False
            
        # Kiểm tra trường comparison trong horizon đầu tiên (T+1)
        h1 = horizons[0]
        comparison = h1.get("comparison", [])
        
        if len(comparison) < 3:
            print(f"FAILED: Expected at least 3 models, found {len(comparison)}")
            return False
            
        model_names = [m.get("name") for m in comparison]
        print(f"PASSED: Models found: {', '.join(model_names)}")
        
        for m in comparison:
            if m.get("expected_return") is None or m.get("mae") is None:
                print(f"FAILED: Model {m.get('name')} missing data (return/mae)")
                return False
                
        print("PASSED: Multi-horizon comparison data is valid.")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    print("STARTING VIC FORECASTING SYSTEM HEALTH CHECK\n" + "="*40)
    m_ok = check_market_history()
    h_ok = check_multi_horizon()
    
    print("\n" + "="*40 + "\nSUMMARY:")
    if m_ok and h_ok:
        print("SUCCESS: System passed all tests.")
    else:
        print("WARNING: Some tests failed.")

