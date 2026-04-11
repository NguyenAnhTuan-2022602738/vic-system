# Plan: VIC Multimodal Forecasting System
Created: 2026-03-19
Status: 🟡 In Progress

## Overview
Hệ thống dự báo lợi nhuận cổ phiếu VIC sử dụng mô hình học máy đa phương thức (giá + tin tức). Tập trung vào độ chính xác của tỷ lệ lợi nhuận (%) và biểu diễn xác suất.

## Tech Stack
- Frontend: Next.js + Tailwind CSS
- Backend: Node.js (Orchestrator)
- AI Service: FastAPI + PyTorch (LSTM) + Scikit-Learn (RF, LR)
- Database: MongoDB

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | Connectivity & Setup | ✅ Complete | 100% |
| 02 | AI Accuracy Optimization | ✅ Complete | 100% |
| 03 | Full System Integration | ✅ Complete | 100% |
| 05 | Real-world Synchronization | ✅ Complete | 100% |
| 06 | Multi-Model Evolution | ✅ Complete | 100% |

## Next Steps
1. Triển khai Random Forest & Linear Regression trong AI Service.
2. So sánh hiệu suất (MAE/RMSE) giữa các mô hình.
3. Cập nhật Dashboard so sánh.
