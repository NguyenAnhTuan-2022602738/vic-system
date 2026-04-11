"""
Dịch vụ dữ liệu thị trường — lấy dữ liệu từ CSV và tự động cập nhật qua VNDirect API.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from app.core.logger import logger
from vnstock import Vnstock
from app.domain.forecasting.feature_builder import compute_rsi, compute_macd, compute_ma, compute_volatility

class MarketDataService:
    """Xử lý việc lấy dữ liệu lịch sử và sinh dữ liệu giả lập."""

    CSV_PATH = r"c:\Users\cuida\Documents\DATN\vic-system\ai-service\data\raw\vic_price.csv"

    def get_vic_history(self, start_date: str = "2024-01-01", end_date: str = None) -> pd.DataFrame:
        """Lấy dữ liệu lịch sử VIC đảm bảo đã được update tới T-1 hoặc mốc end_date."""
        self.update_csv_if_needed()
        if not os.path.exists(self.CSV_PATH):
            return pd.DataFrame()
        df = pd.read_csv(self.CSV_PATH)
        df['date'] = pd.to_datetime(df['date'])
        
        # Lọc theo start_date
        df = df[df['date'] >= start_date]
        
        # Lọc theo end_date (Nếu có)
        if end_date:
            end_dt = pd.to_datetime(end_date)
            df = df[df['date'] <= end_dt]
            
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        return df

    def update_csv_if_needed(self):
        """Cập nhật vic_price.csv bằng dữ liệu đóng cửa từ VNStock (tới T-1)."""
        if not os.path.exists(self.CSV_PATH):
            logger.warning(f"Không tìm thấy file CSV tại {self.CSV_PATH}. Sẽ tạo mới.")
            # Tạo file mới với header nếu không tồn tại
            df = pd.DataFrame(columns=['date', 'open', 'high', 'low', 'close', 'volume'])
            last_date = datetime(2024, 1, 1)
        else:
            try:
                df = pd.read_csv(self.CSV_PATH)
                if df.empty:
                    last_date = datetime(2024, 1, 1)
                else:
                    df['date'] = pd.to_datetime(df['date'])
                    last_date = df['date'].max()
            except Exception as e:
                logger.error(f"Lỗi đọc CSV: {e}")
                return False

        try:
            # T-1 (Ngày giao dịch gần nhất)
            end_date = datetime.now()
            end_date_str = end_date.strftime('%Y-%m-%d')
            last_date_plus_1 = last_date + timedelta(days=1)
            last_date_str = last_date_plus_1.strftime('%Y-%m-%d')

            if last_date.date() < (datetime.now() - timedelta(days=1)).date():
                logger.info(f"Dữ liệu CSV đang dừng ở {last_date.strftime('%Y-%m-%d')}. Đang dùng vnstock để lấy từ {last_date_str} đến {end_date_str}...")
                
                # Khởi tạo Vnstock (Source VCI như anh yêu cầu)
                stock = Vnstock().stock(symbol="VIC", source="VCI")
                
                # Lấy dữ liệu OHLCV
                df_new = stock.quote.history(start=last_date_str, end=end_date_str, interval="1D")
                
                if df_new is not None and not df_new.empty:
                    # Chuẩn hóa tên cột (lấy đúng open, high, low, close, volume)
                    df_new.columns = [c.lower().replace(" ", "_") for c in df_new.columns]
                    
                    # Mapping cột nếu cần (vnstock thường trả về 'time' hoặc 'date')
                    if 'time' in df_new.columns:
                        df_new = df_new.rename(columns={'time': 'date'})
                    
                    # Đảm bảo đủ các cột OHLCV
                    required_cols = ['date', 'open', 'high', 'low', 'close']
                    if not all(col in df_new.columns for col in required_cols):
                         logger.error(f"Dữ liệu vnstock thiếu cột: {df_new.columns}")
                         return False

                    # Volume mapping
                    for col in df_new.columns:
                        if 'vol' in col and 'volume' not in df_new.columns:
                            df_new = df_new.rename(columns={col: 'volume'})

                    # Chuyển đổi đơn vị (vnstock thường trả về giá thực tế như 47000, 
                    # nhưng nếu nó trả về 47.4 thì mình sẽ x1000)
                    for col in ['open', 'high', 'low', 'close']:
                        if df_new[col].max() < 1000:
                            df_new[col] = df_new[col] * 1000
                    
                    df_new['date'] = pd.to_datetime(df_new['date'])
                    
                    # Merge vào bộ dữ liệu cũ
                    if not df.empty:
                        df = pd.concat([df, df_new], ignore_index=True)
                    else:
                        df = df_new
                        
                    # Dọn dẹp dữ liệu
                    df = df.drop_duplicates(subset=['date']).sort_values('date')
                    df['date'] = df['date'].dt.strftime('%Y-%m-%d')
                    
                    # Chỉ lưu các cột quan trọng
                    keep_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
                    df = df[[c for c in keep_cols if c in df.columns]]
                    
                    df.to_csv(self.CSV_PATH, index=False)
                    logger.info(f"✅ Đã gối đầu {len(df_new)} phiên mới thành công!")
                    return True
                else:
                    logger.info("Vnstock không tìm thấy dữ liệu mới hơn.")
            else:
                logger.info(f"Dữ liệu trong CSV đã là mới nhất ({last_date.strftime('%Y-%m-%d')}).")
            return False
        except Exception as e:
            logger.error(f"Lỗi khi cập nhật dữ liệu VNDirect: {e}")
            return False

    def get_enriched_history(self, start_date: str = "2024-01-01", end_date: str = None) -> list:
        """Lấy dữ liệu và bổ sung các chỉ báo kỹ thuật (hỗ trợ quá khứ)."""
        df = self.get_vic_history(start_date, end_date)
        if df.empty:
            return []
            
        df = df.reset_index(drop=True)
        
        # Tính toán chỉ báo
        df['rsi'] = compute_rsi(df['close'])
        df['macd'], df['macd_signal'], _ = compute_macd(df['close'])
        df['ma20'] = compute_ma(df['close'], 20)
        df['volatility'] = compute_volatility(df['close'])
        
        # Làm sạch dữ liệu để tránh lỗi 500 (JSON Serialization error khi có NaN hoặc Inf)
        df = df.replace([np.inf, -np.inf], 0).fillna(0)
        
        # Đảm bảo các chỉ báo là kiểu số thực và được làm tròn
        numeric_cols = ['open', 'high', 'low', 'close', 'volume', 'rsi', 'macd', 'macd_signal', 'ma20', 'volatility']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = df[col].astype(float).round(2)
        
        return df.to_dict(orient="records")


    def get_volume_profile(self, bins: int = 10) -> dict:
        """Tính toán Volume Profile thực tế từ dữ liệu lịch sử."""
        df = self.get_vic_history()
        if df.empty:
            return {"symbol": "VIC", "bins": []}
            
        # Lấy 100 phiên gần nhất
        df_recent = df.tail(100)
        min_price = df_recent['close'].min()
        max_price = df_recent['close'].max()
        
        if max_price == min_price:
            return {"symbol": "VIC", "bins": []}
            
        # Tạo bins
        bin_edges = np.linspace(min_price, max_price, bins + 1)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
        
        # Nhóm volume theo price bins
        volumes = []
        for i in range(bins):
            mask = (df_recent['close'] >= bin_edges[i]) & (df_recent['close'] < bin_edges[i+1])
            bin_vol = df_recent.loc[mask, 'volume'].sum()
            volumes.append(float(bin_vol))
            
        # Xác định S/R (Support/Resistance) đơn giản dựa trên peaks
        avg_vol = np.mean(volumes)
        max_vol_idx = np.argmax(volumes)
        
        result_bins = []
        for i in range(bins):
            v_type = "neutral"
            if i == max_vol_idx:
                # Nếu là bin có vol lớn nhất và nằm ở nửa dưới là Support, nửa trên là Resistance
                v_type = "support" if bin_centers[i] < (min_price + max_price)/2 else "resistance"
            elif volumes[i] > avg_vol * 1.5:
                 v_type = "resistance" if bin_centers[i] > df_recent['close'].iloc[-1] else "support"
                 
            result_bins.append({
                "price": round(float(bin_centers[i]), 0),
                "volume": volumes[i],
                "type": v_type
            })
            
        return {
            "symbol": "VIC",
            "bins": result_bins
        }
