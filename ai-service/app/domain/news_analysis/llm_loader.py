"""
Bộ tải LLM — giao tiếp với mô hình tự host qua Ollama.
Hỗ trợ Vistral-7B (tiếng Việt), Qwen2.5-7B làm dự phòng.
"""

import requests
from app.core.config import settings
from app.core.logger import logger


def query_llm(prompt: str, temperature: float = 0.1) -> str:
    """
    Gửi prompt tới LLM tự host qua Ollama API.

    Tham số:
        prompt: Đoạn văn bản prompt cần gửi
        temperature: Nhiệt độ sinh (thấp hơn = xác định hơn)

    Trả về:
        Văn bản phản hồi từ mô hình
    """
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
        },
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.exceptions.ConnectionError:
        logger.error(
            f"Không thể kết nối Ollama tại {settings.OLLAMA_BASE_URL}. "
            "Hãy chắc chắn Ollama đang chạy."
        )
        raise
    except requests.exceptions.Timeout:
        logger.error("Yêu cầu Ollama bị hết thời gian chờ.")
        raise


def check_ollama_health() -> bool:
    """Kiểm tra Ollama đang chạy và mô hình có sẵn không."""
    try:
        url = f"{settings.OLLAMA_BASE_URL}/api/tags"
        response = requests.get(url, timeout=5)
        response.raise_for_status()

        models = response.json().get("models", [])
        model_names = [m.get("name", "") for m in models]

        if settings.OLLAMA_MODEL in model_names:
            logger.info(f"Mô hình Ollama '{settings.OLLAMA_MODEL}' sẵn sàng")
            return True
        else:
            logger.warning(
                f"Mô hình '{settings.OLLAMA_MODEL}' không tìm thấy. "
                f"Danh sách có sẵn: {model_names}. "
                f"Chạy: ollama pull {settings.OLLAMA_MODEL}"
            )
            return False
    except Exception as e:
        logger.error(f"Kiểm tra Ollama thất bại: {e}")
        return False
