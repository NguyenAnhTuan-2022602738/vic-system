# Phase 02: AI Accuracy Optimization
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Tập trung tối ưu độ chính xác của dự báo lợi nhuận (%) cho mã VIC.

## Requirements
### Functional
- [ ] Rà soát lại code training trong `ai-service/scripts/train.py`.
- [ ] **Thiết kế lại ConditionalLSTM:** Chuyển đổi từ `nn.LSTM` sang logic "code tay" (tự định nghĩa các cổng Forget, Input, Output, Cell state dùng nn.Parameter).
- [ ] Kiểm tra bộ chuẩn hóa dữ liệu (`scaler.json`) để đảm bảo không bị data leakage.

## Implementation Steps
1. [ ] Phân tích kết quả dự báo hiện tại của `active_model.pt`.
2. [ ] Cập nhật pipeline fetch dữ liệu từ Vnstock để lấy data mới nhất.
3. [ ] Train lại model với mục tiêu giảm thiểu lỗi (MAE/MSE) trên dự báo %.

## Files to Create/Modify
- `ai-service/scripts/train.py` - Logic training.
- `ai-service/app/domain/forecasting/conditional_model.py` - Kiến trúc model.

## Test Criteria
- [ ] Độ lỗi MAE trên tập test thấp hơn ngưỡng yêu cầu.
- [ ] Dự báo mẫu trên Dashboard khớp với xu hướng thực tế của VIC.
