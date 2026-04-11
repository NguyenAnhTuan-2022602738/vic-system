# Phase 01: Connectivity & Setup
Status: ⬜ Pending
Dependencies: None

## Objective
Thiết lập môi trường và kết nối cơ bản giữa 3 dịch vụ: Frontend, Backend và AI Service.

## Requirements
### Functional
- [ ] Khởi tạo `.env` cho Web Backend và AI Service.
- [ ] Chạy thành công Backend (Node.js) và AI Service (FastAPI).
- [ ] Kiểm tra API Healthcheck giữa các dịch vụ.

## Implementation Steps
1. [ ] Tạo file `.env` từ `.env.example` trong `web-backend` và `ai-service`.
2. [ ] Chạy `npm install` trong `web-backend`.
3. [ ] Kích hoạt `venv` và kiểm tra dependencies trong `ai-service`.
4. [ ] Khởi động AI Service (uvicorn).
5. [ ] Khởi động Web Backend (npm run dev/start).

## Files to Create/Modify
- `web-backend/.env` - Cấu hình cổng và URL AI Service.
- `ai-service/.env` - Cấu hình cổng và model path.

## Test Criteria
- [ ] `curl http://localhost:8000/health` trả về 200 OK.
- [ ] `curl http://localhost:3000/api/health` (backend endpoint) trả về 200 OK.

---
Next Phase: [Phase 02: Data Pipeline & Scaling](./phase-02-data.md)
