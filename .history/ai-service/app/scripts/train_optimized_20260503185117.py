import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from datetime import datetime

# Thêm đường dẫn root để import được app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.domain.forecasting.hybrid_model import HybridConditionalLSTM
from app.domain.forecasting.feature_builder import build_features, create_sequences
from app.domain.forecasting.data_scaler import FeatureScaler
# from app.services.market_data_service import MarketDataService
from app.core.config import settings

def train_model():
    print("🚀 Bắt đầu quy trình huấn luyện LSTM Hybrid Siêu cấp...", flush=True)
    
    print("🔍 DEBUG: Đọc dữ liệu trực tiếp từ CSV...", flush=True)
    CSV_PATH = r"c:\Users\cuida\Documents\DATN\vic-system\ai-service\data\raw\vic_price.csv"
    df_raw = pd.read_csv(CSV_PATH)
    df_raw['date'] = pd.to_datetime(df_raw['date'])
    df_raw = df_raw[df_raw['date'] >= "2015-01-01"]
    print(f"✅ DEBUG: Đã lấy {len(df_raw)} phiên giao dịch.", flush=True)
    
    print("🔍 DEBUG: Đang xây dựng đặc trưng...", flush=True)
    df_features = build_features(df_raw)
    print(f"✅ DEBUG: Xây dựng đặc trưng xong. Rows: {len(df_features)}", flush=True)
    
    print("🔍 Bước 3: Chuẩn hóa dữ liệu...", flush=True)
    feature_cols = [
        "open", "high", "low", "close", "volume_norm",
        "rsi", "macd", "ma20", "volatility",
    ]
    scaler = FeatureScaler()
    df_scaled = scaler.fit_transform(df_features, feature_cols)
    print("✅ Chuẩn hóa xong.", flush=True)
    scaler_path = settings.MODEL_PATH.replace("active_model.pt", "scaler.json")
    scaler.save(scaler_path)
    print(f"✅ Đã lưu bộ chuẩn hóa tại {scaler_path}", flush=True)
    
    # 4. Tạo sequences
    samples = create_sequences(df_scaled, seq_len=60, feature_cols=feature_cols)
    print(f"📦 Tổng số mẫu huấn luyện: {len(samples)}", flush=True)
    
    # Chuyển sang Tensor
    X = torch.stack([torch.tensor(s["sequence"]) for s in samples])
    H = torch.tensor([[s["horizon"]] for s in samples], dtype=torch.float32)
    Y = torch.tensor([[s["target_return"]] for s in samples], dtype=torch.float32)
    
    # Chia train/val (80/20)
    split = int(0.8 * len(X))
    train_ds = TensorDataset(X[:split], H[:split], Y[:split])
    val_ds = TensorDataset(X[split:], H[split:], Y[split:])
    
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=32)
    
    # 5. Khởi tạo Model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = HybridConditionalLSTM(input_size=len(feature_cols)).to(device)
    
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)
    
    # Loss function: Gaussian Negative Log Likelihood
    def criterion(mu, sigma, target):
        return torch.mean(0.5 * torch.log(sigma**2) + 0.5 * (target - mu)**2 / (sigma**2 + 1e-6))

    # Directional Penalty
    def directional_penalty(mu, target):
        return torch.mean(torch.relu(-mu * target)) * 2.0

    # 6. Training Loop
    best_val_loss = float('inf')
    patience_counter = 0
    max_patience = 15
    epochs = 100
    
    print(f"🏃 Đang huấn luyện trên {device}...")
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0
        for batch_x, batch_h, batch_y in train_loader:
            batch_x, batch_h, batch_y = batch_x.to(device), batch_h.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            mu, sigma = model(batch_x, batch_h)
            
            loss = criterion(mu, sigma, batch_y) + directional_penalty(mu, batch_y)
            loss.backward()
            
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item()
            
        # Validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for batch_x, batch_h, batch_y in val_loader:
                batch_x, batch_h, batch_y = batch_x.to(device), batch_h.to(device), batch_y.to(device)
                mu, sigma = model(batch_x, batch_h)
                loss = criterion(mu, sigma, batch_y)
                val_loss += loss.item()
        
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        scheduler.step(avg_val_loss)
        
        if (epoch + 1) % 5 == 0:
            print(f"Epoch {epoch+1}/{epochs} | Train Loss: {avg_train_loss:.6f} | Val Loss: {avg_val_loss:.6f}", flush=True)
            
        # Lưu model tốt nhất (vẫn giữ logic lưu tốt nhất nhưng không dừng sớm)
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), settings.MODEL_PATH)
            patience_counter = 0
            print(f"🌟 Epoch {epoch+1}: Đã cập nhật model tốt nhất mới (Val Loss: {best_val_loss:.6f})", flush=True)
        else:
            patience_counter += 1
                
    print(f"✅ Hoàn tất đủ {epochs} Epochs! Model tối ưu nhất đã được lưu tại {settings.MODEL_PATH}", flush=True)

if __name__ == "__main__":
    train_model()
