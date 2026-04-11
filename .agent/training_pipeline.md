# TRAINING PIPELINE (LOCAL / COLAB)

1. Load historical dataset
2. Generate training samples:
   (sequence_30d, horizon_X, target_return)
3. Split train/validation
4. Train Conditional LSTM
5. Evaluate:
   - MAE
   - NLL
   - Calibration
6. Save model:
   conditional_lstm.pt
7. Copy model vào ai-service/models/