import os
import time
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logger import logger

class AssistantService:
    """Dịch vụ AI Assistant sử dụng Gemini Pro để phân tích tài chính cổ phiếu VIC."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL_NAME
        self.is_configured = False
        self._setup_gemini()

    def _setup_gemini(self):
        """Khởi tạo mô hình Gemini nếu có API Key."""
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                self.is_configured = True
                logger.info(f"✅ AI Assistant đã được cấu hình với mô hình {self.model_name}")
            except Exception as e:
                logger.error(f"❌ Lỗi cấu hình Gemini: {e}")
                self.is_configured = False
        else:
            logger.warning("⚠️ GEMINI_API_KEY chưa được thiết lập. Assistant sẽ chạy ở chế độ Mock.")

    def chat(self, message: str, context: Optional[str] = None) -> str:
        """Thực hiện chat với AI, có kèm theo bối cảnh hệ thống."""
        if not self.is_configured:
            return self._mock_response(message, context)

        try:
            # Gộp bối cảnh vào System Prompt
            system_prompt = (
                "Bạn là VIC AI Co-Pilot, một trợ lý phân tích tài chính chuyên nghiệp cho mã cổ phiếu VIC (Vingroup). "
                "Hãy trả lời người dùng dựa trên dữ liệu thực tế từ hệ thống dự báo AI của chúng tôi. "
                "Phong cách trả lời: Chuyên nghiệp, ngắn gọn, súc tích và có tính thuyết phục cao. "
                "Nếu không có dữ liệu, hãy trả lời dựa trên kiến thức chung nhưng phải cảnh báo rõ. "
                "\n\nBối cảnh hiện tại của hệ thống:\n"
                f"{context or 'Không có dữ liệu bối cảnh hiện tại.'}"
            )

            response = self.model.generate_content([system_prompt, f"Người dùng hỏi: {message}"])
            return response.text
        except Exception as e:
            logger.error(f"Error in Gemini Chat: {e}")
            return f"Xin lỗi, tôi đang gặp khó khăn khi kết nối với bộ não AI. Tuy nhiên, dựa trên dữ liệu hệ thống: {self._extract_fallback_info(context)}"

    def _mock_response(self, message: str, context: Optional[str] = None) -> str:
        """Tạo câu trả lời giả lập nếu không có API Key (Dùng cho Demo an toàn)."""
        msg = message.lower()
        
        # Logic rule-based đơn giản để demo
        if "tại sao" in msg or "lý do" in msg or "nên mua" in msg:
            if "BUY" in (context or ""):
                return ("Dựa trên phân tích của tôi, VIC đang nhận được tín hiệu 'MUA' mạnh mẽ. "
                        "Nguyên nhân là do mô hình LSTM phát hiện xu hướng giá đang thoát khỏi vùng tích lũy, "
                        "kết hợp với chỉ số RSI duy trì ở mức cân bằng 55. Ngoài ra, tin tức gần đây về "
                        "doanh số xe VinFast đang tạo tâm lý tích cực cho các nhà đầu tư.")
            else:
                return ("Hiện tại hệ thống khuyến nghị 'GIỮ'. Các mô hình AI cho thấy giá VIC đang đi ngang "
                        "với biên độ hẹp. Chúng ta nên đợi tín hiệu xác nhận từ khối lượng giao dịch trước khi hành động.")
        
        if "giá" in msg or "bao nhiêu" in msg:
            return f"Giá hiện tại của VIC được ghi nhận trong hệ thống là khoảng {self._get_price_from_context(context)}. Xu hướng ngắn hạn đang có sự cải thiện nhẹ."

        return ("Chào anh! Tôi là VIC AI Co-Pilot. Tôi có thể giúp anh giải thích các tín hiệu dự báo, "
                "tóm tắt tin tức hoặc tính toán rủi ro cho mã cổ phiếu VIC. Anh muốn tôi giúp gì hôm nay?")

    def _get_price_from_context(self, context: str) -> str:
        if not context: return "47,800 VND"
        # Trích xuất giá từ text context đơn giản
        import re
        match = re.search(r"Price: ([\d,.]+)", context)
        return match.group(1) if match else "47,800 VND"

    def _extract_fallback_info(self, context: str) -> str:
        if not context: return "Hệ thống vẫn đang hoạt động ổn định."
        # Trích xuất recommendation
        if "BUY" in context: return "Tín hiệu hiện tại là MUA với xác suất cao."
        if "SELL" in context: return "Tín hiệu hiện tại là BÁN, hãy cẩn trọng."
        return "Tín hiệu hiện tại là GIỮ."

# Khởi tạo singleton
assistant_service = AssistantService()
