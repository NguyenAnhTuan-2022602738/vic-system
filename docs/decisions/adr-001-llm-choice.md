# ADR-001: Chọn mô hình LLM tự host

## Ngày: 2026-02-26

## Trạng thái: Đã quyết định

## Bối cảnh

Dự án cần phân tích tâm lý tin tức tiếng Việt về cổ phiếu VIC. Cần chọn LLM phù hợp với yêu cầu:
- Hiểu tiếng Việt tốt
- Có thể tự host (không phụ thuộc API bên ngoài)
- Cho phép fine-tune sau này
- Chạy được trên phần cứng phổ thông

## Các lựa chọn đã cân nhắc

### 1. OpenAI GPT-4 (API)
- ✅ Chất lượng tốt nhất
- ❌ Phụ thuộc bên ngoài, tốn phí, dữ liệu rời máy

### 2. Vistral-7B (Self-hosted via Ollama)
- ✅ Thiết kế riêng cho tiếng Việt
- ✅ Tự host, miễn phí
- ✅ Có thể fine-tune
- ⚠️ Cần 8GB RAM tối thiểu

### 3. Qwen2.5-7B (Self-hosted via Ollama)
- ✅ Đa ngôn ngữ tốt, bao gồm tiếng Việt
- ✅ Tự host, miễn phí
- ✅ Có thể fine-tune
- ⚠️ Không chuyên tiếng Việt bằng Vistral

### 4. Gemma 2 (Self-hosted)
- ✅ Nhẹ, hiệu suất tốt
- ❌ Hỗ trợ tiếng Việt hạn chế

## Quyết định

**Ưu tiên: Vistral-7B**, dự phòng: Qwen2.5-7B

### Lý do:
1. Vistral được thiết kế riêng cho tiếng Việt → hiểu ngữ cảnh tài chính VN tốt hơn
2. Self-host qua Ollama → đơn giản, không cần GPU đắt tiền
3. Có thể fine-tune thêm dữ liệu tài chính VIC sau này
4. Qwen2.5 làm dự phòng nếu Vistral không đáp ứng

## Hệ quả

- Cần cài Ollama trên máy phát triển
- Cần ít nhất 8GB RAM
- Inference chậm hơn API cloud nhưng miễn phí và bảo mật
- Có lộ trình fine-tune khi thu thập đủ dữ liệu
