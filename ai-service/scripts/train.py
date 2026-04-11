"""
Training script for Conditional LSTM.
Can be run locally or adapted for Google Colab.

Usage:
    cd ai-service
    python scripts/train.py --data_path ../data/processed/vic_features.csv --epochs 100
"""

import os
import sys
import argparse
import json
from datetime import datetime

import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader, random_split

# Add ai-service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.domain.forecasting.conditional_model import ConditionalLSTM
from app.domain.forecasting.probabilistic_head import GaussianNLLLoss
from app.domain.forecasting.feature_builder import build_features, create_sequences
from app.domain.forecasting.data_scaler import FeatureScaler
from app.domain.forecasting.dataset import VICStockDataset


FEATURE_COLS = [
    "open", "high", "low", "close", "volume_norm",
    "rsi", "macd", "ma20", "volatility",
]


def train(
    data_path: str,
    model_save_path: str = "models/active_model.pt",
    scaler_save_path: str = "models/scaler.json",
    epochs: int = 100,
    batch_size: int = 32,
    learning_rate: float = 1e-3,
    hidden_size: int = 128,
    num_layers: int = 2,
    seq_len: int = 60,
    val_ratio: float = 0.2,
) -> dict:
    """
    Full training pipeline.

    Args:
        data_path: Path to processed features CSV
        model_save_path: Where to save trained model
        scaler_save_path: Where to save scaler parameters
        epochs: Number of training epochs
        batch_size: Batch size
        learning_rate: Learning rate
        hidden_size: LSTM hidden size
        num_layers: Number of LSTM layers
        seq_len: Input sequence length
        val_ratio: Validation set ratio


    Returns:
        Dict with training metrics
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🖥️  Device: {device}")

    # ==========================================
    # 1. Load and prepare data
    # ==========================================
    print("\n📊 Loading data...")
    df = pd.read_csv(data_path)

    # Kiểm tra xem tất cả các đặc trưng cần thiết đã có chưa
    missing_cols = [col for col in FEATURE_COLS if col not in df.columns]
    if missing_cols:
        print(f"   ⚠️ Missing features: {missing_cols}. Building features from raw data...")
        df = build_features(df)


    print(f"   Rows: {len(df)}, Columns: {list(df.columns)}")

    # ==========================================
    # 2. Scale features
    # ==========================================
    print("\n🔧 Scaling features...")
    scaler = FeatureScaler()
    df_scaled = scaler.fit_transform(df, FEATURE_COLS)
    scaler.save(scaler_save_path)
    print(f"   Scaler saved: {scaler_save_path}")

    # ==========================================
    # 3. Create training samples
    # ==========================================
    print("\n📦 Creating sequences...")
    samples = create_sequences(df_scaled, seq_len=seq_len, feature_cols=FEATURE_COLS)
    print(f"   Total samples: {len(samples)}")

    if len(samples) == 0:
        print("❌ No samples created. Check data length.")
        return {}

    # ==========================================
    # 4. Chronological Split (Prevent Data Leakage)
    # ==========================================
    dataset = VICStockDataset(samples)
    val_size = int(len(dataset) * val_ratio)
    train_size = len(dataset) - val_size

    # Phân tách theo thời gian (không dùng random_split cho time-series)
    train_dataset = torch.utils.data.Subset(dataset, range(train_size))
    val_dataset = torch.utils.data.Subset(dataset, range(train_size, len(dataset)))

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    print(f"   Train: {train_size} (Truoc), Val: {val_size} (Sau)")

    # ==========================================
    # 5. Initialize model
    # ==========================================
    model = ConditionalLSTM(
        input_size=len(FEATURE_COLS),
        hidden_size=hidden_size,
        num_layers=num_layers,
    ).to(device)

    criterion = GaussianNLLLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=10
    )

    total_params = sum(p.numel() for p in model.parameters())
    print(f"\n🧠 Model: ConditionalLSTM ({total_params:,} params)")

    # ==========================================
    # 6. Training loop
    # ==========================================
    print(f"\n🚀 Training for {epochs} epochs...\n")

    # Tạo thư mục models trước
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)

    best_val_loss = float("inf")
    best_val_mae = float("inf")  # Thêm tracker cho MAE
    history = {"train_loss": [], "val_loss": [], "val_mae": []}

    for epoch in range(1, epochs + 1):
        # --- Train ---
        model.train()
        train_losses = []

        for sequences, horizons, targets in train_loader:
            sequences = sequences.to(device)
            horizons = horizons.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            mu, sigma = model(sequences, horizons)
            loss = criterion(mu, sigma, targets)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_losses.append(loss.item())

        avg_train_loss = np.mean(train_losses)

        # --- Validate ---
        model.eval()
        val_losses = []
        val_maes = []

        with torch.no_grad():
            for sequences, horizons, targets in val_loader:
                sequences = sequences.to(device)
                horizons = horizons.to(device)
                targets = targets.to(device)

                mu, sigma = model(sequences, horizons)
                loss = criterion(mu, sigma, targets)
                mae = torch.abs(mu - targets).mean()

                val_losses.append(loss.item())
                val_maes.append(mae.item())

        avg_val_loss = np.mean(val_losses)
        avg_val_mae = np.mean(val_maes)

        scheduler.step(avg_val_loss)

        history["train_loss"].append(avg_train_loss)
        history["val_loss"].append(avg_val_loss)
        history["val_mae"].append(avg_val_mae)

        # Save best model (Cập nhật: Ưu tiên MAE nếu NLL bùng nổ)
        is_best = False
        if not np.isnan(avg_val_mae) and avg_val_mae < best_val_mae:
            best_val_mae = avg_val_mae
            is_best = True
            print(f"   🌟 New record MAE: {best_val_mae:.6f} - Saving model...")
            torch.save(model.state_dict(), model_save_path)
            
        # Vẫn theo dõi NLL nhưng không ghi đè nếu MAE đang tốt hơn
        if not np.isnan(avg_val_loss) and avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss

        # Print progress
        if epoch % 10 == 0 or epoch == 1:
            print(
                f"Epoch {epoch:3d}/{epochs} | "
                f"Train NLL: {avg_train_loss:.4f} | "
                f"Val NLL: {avg_val_loss:.4f} | "
                f"Val MAE: {avg_val_mae:.6f} | "
                f"Best: {best_val_loss:.4f}"
            )

    # ==========================================
    # 7. Final evaluation
    # ==========================================
    print(f"\n✅ Training complete!")
    print(f"   Best Val NLL: {best_val_loss:.4f}")
    print(f"   Model saved: {model_save_path}")

    # Calibration check (on val set)
    model.load_state_dict(
        torch.load(model_save_path, map_location=device, weights_only=True)
    )
    model.eval()

    all_mu, all_sigma, all_targets = [], [], []
    with torch.no_grad():
        for sequences, horizons, targets in val_loader:
            sequences = sequences.to(device)
            horizons = horizons.to(device)
            mu, sigma = model(sequences, horizons)
            all_mu.extend(mu.cpu().numpy().flatten())
            all_sigma.extend(sigma.cpu().numpy().flatten())
            all_targets.extend(targets.numpy().flatten())

    all_mu = np.array(all_mu)
    all_sigma = np.array(all_sigma)
    all_targets = np.array(all_targets)

    # Calibration: % of targets within ±1σ (should be ~68%)
    within_1sigma = np.mean(np.abs(all_targets - all_mu) <= all_sigma)
    # % within ±2σ (should be ~95%)
    within_2sigma = np.mean(np.abs(all_targets - all_mu) <= 2 * all_sigma)

    final_mae = np.mean(np.abs(all_targets - all_mu))

    metrics = {
        "best_val_nll": float(best_val_loss),
        "final_mae": float(final_mae),
        "calibration_1sigma": float(within_1sigma),
        "calibration_2sigma": float(within_2sigma),
        "total_epochs": epochs,
        "total_samples": len(samples),
        "train_size": train_size,
        "val_size": val_size,
        "timestamp": datetime.now().isoformat(),
    }

    print(f"\n📈 Metrics:")
    print(f"   MAE: {final_mae:.6f}")
    print(f"   Calibration 1σ: {within_1sigma:.1%} (target ~68%)")
    print(f"   Calibration 2σ: {within_2sigma:.1%} (target ~95%)")

    # Save metrics
    metrics_path = os.path.join(os.path.dirname(model_save_path), "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"   Metrics saved: {metrics_path}")

    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Conditional LSTM for VIC")
    parser.add_argument(
        "--data_path",
        type=str,
        default="../data/processed/vic_features.csv",
        help="Path to processed features CSV",
    )
    parser.add_argument("--epochs", type=int, default=200)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden_size", type=int, default=128)
    parser.add_argument("--num_layers", type=int, default=2)
    parser.add_argument("--model_path", type=str, default="models/active_model.pt")

    args = parser.parse_args()

    train(
        data_path=args.data_path,
        model_save_path=args.model_path,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        hidden_size=args.hidden_size,
        num_layers=args.num_layers,
    )
