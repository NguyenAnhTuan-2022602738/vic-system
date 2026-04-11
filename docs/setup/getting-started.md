# Hướng dẫn Cài đặt & Chạy — VIC System

## Yêu cầu

| Phần mềm | Phiên bản | Mục đích |
|----------|----------|---------|
| Python | 3.11+ | AI Service |
| Node.js | 18+ | Web Backend + Frontend |
| MongoDB | 6.0+ | Cơ sở dữ liệu |
| Docker | 24+ | Containerization |
| Ollama | latest | LLM tự host |

---

## Cách 1: Chạy bằng Docker (Khuyến nghị)

```bash
# Clone dự án
git clone <repo-url>
cd vic-system

# Khởi động tất cả services
docker-compose up -d

# Kiểm tra
curl http://localhost:8000/health   # AI Service
curl http://localhost:3000/health   # Web Backend
open http://localhost:5173          # Frontend
```

## Cách 2: Chạy thủ công

### Bước 1: MongoDB

```bash
# Cài MongoDB Community
# https://www.mongodb.com/try/download/community

# Hoặc chạy qua Docker
docker run -d -p 27017:27017 --name vic-mongo mongo:7
```

### Bước 2: Ollama LLM

```bash
# Cài Ollama (xem chi tiết: docs/setup/ollama-setup.md)
# Windows: tải từ https://ollama.com/download/windows
# Linux: curl -fsSL https://ollama.com/install.sh | sh

# Tải model
ollama pull vistral:7b
```

### Bước 3: AI Service

```bash
cd ai-service

# Tạo virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Cài dependencies
pip install -r requirements.txt

# Tạo file .env
copy .env.example .env

# Chạy
uvicorn app.main:app --reload --port 8000
```

### Bước 4: Web Backend

```bash
cd web-backend

# Cài dependencies
npm install

# Tạo file .env
copy .env.example .env

# Chạy
npm run dev
```

### Bước 5: Frontend

```bash
cd frontend

# Cài dependencies
npm install

# Tạo file .env
copy .env.example .env

# Chạy
npm run dev
```

---

## Lấy dữ liệu & Train Model

```bash
# 1. Fetch dữ liệu VIC từ vnstock
cd vic-system
python scripts/fetch_data.py

# 2. Train model (từ thư mục ai-service)
cd ai-service
python scripts/train.py --data_path ../data/processed/vic_features.csv --epochs 100

# 3. Kiểm tra kết quả
cat models/metrics.json
```

---

## Biến môi trường

### AI Service (`.env`)
```env
APP_NAME=VIC AI Service
DEBUG=false
HOST=0.0.0.0
PORT=8000
MODEL_PATH=models/active_model.pt
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=vistral:7b
ALPHA=0.3
BETA=0.2
```

### Web Backend (`.env`)
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/vic_system
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## Khắc phục lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|------------|-----------|
| `ModuleNotFoundError` | Chưa cài dependencies | `pip install -r requirements.txt` |
| `Connection refused :8000` | AI service chưa chạy | `uvicorn app.main:app --reload` |
| `ECONNREFUSED :27017` | MongoDB chưa chạy | Khởi động MongoDB service |
| `Model not found` | Chưa train model | Chạy `scripts/train.py` |
| `Ollama connection error` | Ollama chưa chạy | `ollama serve` |
