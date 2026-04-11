# QUY TẮC TOÁN HỌC

## 1. Định nghĩa lợi nhuận

Return(t, X) = (Price(t+X) - Price(t)) / Price(t)

---

## 2. Phân phối dự báo

Giả định Gaussian:

Return ~ N(μ, σ²)

---

## 3. Xác suất

P(Return > 0)

P(Return > target)

---

## 4. Value-at-Risk

VaR(95%) = μ - 1.65σ

---

## 5. Quy tắc ra quyết định

BUY nếu:
- P(Return > 0) > 65%
- VaR > -3%
- μ/σ > threshold

HOLD nếu trung tính.
AVOID nếu kỳ vọng âm.

---
---

# QUY TẮC PHÁT TRIỂN PHẦN MỀM

## 6. Kiến trúc tổng thể

- Hệ thống chia 3 service độc lập: `ai-service`, `web-backend`, `frontend`
- Giao tiếp giữa các service qua REST API (JSON)
- Mỗi service có Dockerfile riêng, orchestrate bằng `docker-compose.yml`
- Tuân thủ **Clean Architecture**: tách rõ domain logic khỏi framework và infrastructure

---

## 7. Quy tắc chung (All Services)

### 7.1 Coding Style

- Đặt tên biến/hàm rõ nghĩa, bằng **tiếng Anh**
- **Tất cả comment, docstring, và documentation phải viết bằng TIẾNG VIỆT**
  - Comment trong code: tiếng Việt
  - Docstring (Python): tiếng Việt
  - JSDoc (JS): tiếng Việt
  - File README, docs/: tiếng Việt
  - Chỉ giữ **tiếng Anh** cho: tên biến, tên hàm, tên class, tên file
- Comment giải thích **tại sao**, không phải **cái gì**
- Mỗi file chỉ làm **một nhiệm vụ** (Single Responsibility)
- Không hardcode giá trị — dùng config/env
- Không commit file chứa credentials hoặc secrets

### 7.2 Git Workflow

- Nhánh chính: `main` (stable), `develop` (tích hợp)
- Feature branch: `feature/<tên-feature>`
- Hotfix branch: `hotfix/<mô-tả>`
- Commit message theo format: `<type>: <mô tả ngắn>`
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
  - Ví dụ: `feat: add forecast endpoint`, `fix: correct VaR calculation`
- Mỗi commit giải quyết **một vấn đề duy nhất**

### 7.3 Error Handling

- Không bao giờ để exception chạy silent
- Log đầy đủ: level (INFO, WARN, ERROR), timestamp, context
- Trả về error response có cấu trúc thống nhất:
  ```json
  {
    "success": false,
    "error": {
      "code": "FORECAST_FAILED",
      "message": "Mô tả lỗi"
    }
  }
  ```

### 7.4 Environment & Config

- Dùng `.env` cho từng service, **không commit** `.env` lên git
- Có file `.env.example` mẫu cho mỗi service
- Config load từ environment variables, có giá trị mặc định hợp lý

---

## 8. AI Service (Python / FastAPI)

### 8.1 Code Convention

- Python >= 3.10
- Format code bằng **Black**, lint bằng **Ruff**
- Type hints bắt buộc cho tất cả function signatures
- Docstring theo format Google style

### 8.2 Architecture Rules

- `domain/` — Pure business logic, **KHÔNG** import FastAPI, database, hoặc external lib
- `services/` — Orchestration, gọi domain + infrastructure
- `api/` — Chỉ nhận request, validate, gọi service, trả response
- `infrastructure/` — Database, file I/O, model loading
- Schema validation dùng **Pydantic v2**

### 8.3 Model Management

- Model weights lưu tại `models/active_model.pt`
- Mỗi lần retrain, archive model cũ vào `models/archive/` kèm timestamp
- Không commit file `.pt` lên git — dùng `.gitignore`
- Log training metrics (MAE, NLL, Calibration) vào file hoặc MLflow

### 8.4 Data Pipeline

- Dữ liệu thô lưu trong `data/raw/`, đã xử lý trong `data/processed/`
- Không chỉnh sửa dữ liệu thô — chỉ đọc
- Feature engineering tách riêng trong `domain/forecasting/feature_builder.py`

### 8.5 Testing

- Unit test cho domain logic (không cần mock DB/API)
- Integration test cho API endpoints
- Test framework: **pytest**
- Đặt test trong `tests/` mirror theo cấu trúc `app/`

---

## 9. Web Backend (NodeJS / Express)

### 9.1 Code Convention

- Node >= 18 LTS
- Dùng **ES Modules** (`import/export`)
- Lint bằng **ESLint**, format bằng **Prettier**
- Đặt tên file theo pattern: `<module>.<layer>.js`
  - Ví dụ: `forecast.controller.js`, `forecast.service.js`

### 9.2 Architecture Rules

- Chia theo **feature module**: `forecast/`, `news/`, `trade/`, `model/`
- Mỗi module tự chứa: controller, service, routes, DTO
- Controller chỉ xử lý HTTP — logic nằm trong service
- Giao tiếp AI service qua `integrations/ai_client.js`

### 9.3 API Design

- RESTful, prefix: `/api/v1/`
- Response format thống nhất:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "timestamp": "..." }
  }
  ```
- Validate request bằng middleware (Joi hoặc Zod)
- Rate limiting và CORS bật mặc định

### 9.4 Database

- Dùng MongoDB hoặc PostgreSQL (tuỳ nhu cầu)
- Repository pattern — không gọi DB trực tiếp từ controller
- Migration scripts có version rõ ràng

### 9.5 Testing

- Unit test cho service logic
- Integration test cho API routes
- Test framework: **Jest** hoặc **Vitest**

---

## 10. Frontend (React)

### 10.1 Code Convention

- React >= 18 với **functional components** + **hooks**
- Dùng **Vite** làm build tool
- Lint bằng **ESLint**, format bằng **Prettier**
- Component đặt tên PascalCase: `ForecastCard.jsx`
- File util/hook đặt tên camelCase: `useFormatNumber.js`

### 10.2 Architecture Rules

- Chia theo **feature**: `features/forecast/`, `features/news/`, `features/trade/`
- Mỗi feature chứa: `components/`, `pages/`, `api/`
- Shared components đặt trong `shared/components/`
- State management: React Context hoặc Zustand (tránh Redux nếu không cần)

### 10.3 UI/UX Rules

- Responsive design — mobile-first
- Loading states và error states cho **mọi** API call
- Biểu đồ dùng **Recharts** hoặc **Chart.js**
- Hiển thị distribution chart cho dự báo xác suất

### 10.4 API Integration

- Tất cả API call qua file `api/` trong mỗi feature
- Dùng **Axios** hoặc **fetch** với wrapper có error handling
- Base URL lấy từ environment variable

### 10.5 Testing

- Component test bằng **React Testing Library**
- E2E test bằng **Playwright** (nếu cần)

---

## 11. Security

- Không log thông tin nhạy cảm (API keys, tokens, passwords)
- Validate và sanitize **tất cả** input từ user
- Backend API có authentication (JWT hoặc API key)
- HTTPS bắt buộc khi deploy production
- Cập nhật dependencies thường xuyên, kiểm tra vulnerabilities

---

## 12. Documentation

- Mỗi service có `README.md` riêng: mô tả, cách cài đặt, cách chạy
- API documentation bằng **Swagger/OpenAPI** (auto-gen từ FastAPI)
- Cập nhật docs khi thay đổi API hoặc architecture
- Ghi chú quyết định kiến trúc quan trọng trong `.agent/` folder

---

## 13. Performance

- AI inference phải trả kết quả trong < 2 giây
- API response time mục tiêu < 500ms
- Cache kết quả forecast nếu cùng input trong khoảng thời gian ngắn
- Lazy load components trên frontend
- Tối ưu bundle size — code splitting theo route

---

## 14. Ghi chép bắt buộc (Documentation Log) ⚠️ QUAN TRỌNG

> Mọi thay đổi, mọi hàm tạo, mọi file tạo đều **PHẢI** được ghi chép lại.
> Không được bỏ qua. Không được ghi đè.

### 14.1 Cấu trúc folder `docs/`

```
docs/
├── changelog/                  # Log mọi thay đổi theo ngày
│   ├── 2026-02-26.md
│   ├── 2026-02-27.md
│   └── ...
│
├── api/                        # Tài liệu API endpoints
│   ├── ai-service-api.md
│   ├── web-backend-api.md
│   └── ...
│
├── modules/                    # Hướng dẫn từng module/feature
│   ├── forecast.md
│   ├── news-analysis.md
│   ├── risk-engine.md
│   └── ...
│
├── functions/                  # Giải thích hàm quan trọng
│   ├── ai-service-functions.md
│   ├── web-backend-functions.md
│   └── frontend-functions.md
│
├── setup/                      # Hướng dẫn cài đặt & chạy
│   ├── ai-service-setup.md
│   ├── web-backend-setup.md
│   └── frontend-setup.md
│
└── decisions/                  # Ghi chú quyết định kiến trúc
    ├── 001-model-architecture.md
    └── ...
```

### 14.2 Quy tắc ghi Changelog

- Mỗi ngày làm việc tạo **1 file** trong `docs/changelog/` theo format `YYYY-MM-DD.md`
- **KHÔNG BAO GIỜ ghi đè** file changelog cũ — chỉ tạo file mới hoặc **append** vào cuối file trong ngày
- Mỗi entry ghi rõ:

```markdown
## [HH:MM] - <Mô tả ngắn>

- **Loại**: feat / fix / refactor / docs / chore
- **Service**: ai-service / web-backend / frontend
- **Files thay đổi**:
  - `path/to/file.py` — Mô tả thay đổi
  - `path/to/new_file.py` — [NEW] Mô tả file mới
  - `path/to/deleted.py` — [DELETED] Lý do xoá
- **Hàm mới tạo**:
  - `function_name(params)` trong `file.py` — Mô tả chức năng
- **Ghi chú**: (nếu có điều đặc biệt cần lưu ý)
```

### 14.3 Quy tắc ghi Module docs

- Khi tạo module mới → tạo file tương ứng trong `docs/modules/`
- Ghi rõ: mục đích, input/output, các hàm chính, dependencies
- Khi thêm chức năng vào module → **append** vào cuối file, không xoá nội dung cũ

### 14.4 Quy tắc ghi Function docs

- Khi tạo hàm quan trọng → ghi vào file tương ứng trong `docs/functions/`
- Format mỗi hàm:

```markdown
### `function_name(param1, param2) -> ReturnType`

- **File**: `path/to/file.py`
- **Mục đích**: Mô tả ngắn
- **Parameters**:
  - `param1` (type): mô tả
  - `param2` (type): mô tả
- **Returns**: mô tả
- **Ví dụ sử dụng**:
  ```python
  result = function_name(x, y)
  ```
- **Ngày tạo**: YYYY-MM-DD
```

### 14.5 Quy tắc KHÔNG GHI ĐÈ

- File trong `docs/` **chỉ được append**, không được xoá hoặc sửa nội dung cũ
- Nếu cần cập nhật thông tin → thêm mục mới bên dưới với timestamp, giữ nguyên mục cũ
- Nếu có sai sót → thêm mục **[CORRECTION]** bên dưới, **không xoá** mục sai
- Lịch sử thay đổi phải **luôn được bảo toàn**