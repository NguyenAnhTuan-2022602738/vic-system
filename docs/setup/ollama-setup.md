# Hướng dẫn Setup Ollama — LLM Tự Host

## Tổng quan

Dự án VIC System sử dụng **Ollama** để chạy LLM tự host phục vụ phân tích tin tức tiếng Việt.
Điều này cho phép:
- Không phụ thuộc API bên ngoài (OpenAI, Google...)
- Dữ liệu không rời khỏi máy
- Có thể fine-tune sau này

## Yêu cầu phần cứng

| Thành phần | Tối thiểu | Khuyến nghị |
|-----------|----------|-------------|
| RAM | 8 GB | 16 GB+ |
| GPU VRAM | Không bắt buộc | 8 GB+ (NVIDIA) |
| Ổ đĩa | 10 GB trống | 20 GB trống |

> **Ghi chú**: Có thể chạy trên CPU, nhưng GPU sẽ nhanh hơn đáng kể.

## 1. Cài đặt Ollama

### Windows
```powershell
# Tải từ trang chính thức
# https://ollama.com/download/windows
# Chạy installer .exe
```

### Linux / WSL
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### macOS
```bash
brew install ollama
```

## 2. Tải mô hình

### Mô hình ưu tiên: Vistral-7B (tiếng Việt)
```bash
# Vistral — mô hình tối ưu cho tiếng Việt
ollama pull vistral:7b
```

### Mô hình dự phòng: Qwen2.5-7B
```bash
# Qwen2.5 — hỗ trợ đa ngôn ngữ tốt, bao gồm tiếng Việt
ollama pull qwen2.5:7b
```

### Mô hình nhẹ (cho máy yếu)
```bash
# Qwen2.5 3B — nhẹ hơn, phù hợp máy có ít RAM
ollama pull qwen2.5:3b
```

## 3. Kiểm tra hoạt động

```bash
# Kiểm tra Ollama đang chạy
ollama list

# Thử gửi một prompt
ollama run vistral:7b "Phân tích tâm lý tin tức: Vingroup báo lãi kỷ lục quý 4"
```

## 4. Cấu hình trong dự án

Cập nhật file `.env` trong `ai-service/`:

```env
# Ollama LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=vistral:7b
```

Nếu dùng Qwen thay vì Vistral:
```env
OLLAMA_MODEL=qwen2.5:7b
```

## 5. Kiểm tra tích hợp

```bash
# Chạy AI service
cd ai-service
uvicorn app.main:app --reload

# Thử gọi API phân tích tin tức
curl -X POST http://localhost:8000/api/v1/news/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Vingroup công bố kế hoạch mở rộng VinFast ra thị trường châu Âu"}'
```

## 6. Chuyển đổi mô hình

Để đổi mô hình, chỉ cần:
1. Tải mô hình mới: `ollama pull <tên_model>`
2. Cập nhật `OLLAMA_MODEL` trong `.env`
3. Restart AI service

## 7. Fine-tuning (Giai đoạn sau)

Ollama hỗ trợ tạo Modelfile tùy chỉnh:
```
FROM vistral:7b
SYSTEM "Bạn là chuyên gia phân tích tài chính Việt Nam, chuyên về cổ phiếu VIC (Vingroup)."
PARAMETER temperature 0.1
```

```bash
ollama create vic-analyst -f Modelfile
```

## Khắc phục lỗi

| Lỗi | Nguyên nhân | Giải pháp |
|-----|------------|-----------|
| Connection refused | Ollama chưa chạy | Chạy `ollama serve` |
| Model not found | Chưa tải model | Chạy `ollama pull <model>` |
| Out of memory | RAM/VRAM thiếu | Dùng model nhỏ hơn (3b) |
| Timeout | Model nặng, CPU | Tăng timeout hoặc dùng GPU |
