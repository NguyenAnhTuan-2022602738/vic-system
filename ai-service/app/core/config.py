"""
Cấu hình ứng dụng, tải từ biến môi trường.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Cài đặt ứng dụng."""

    # Ứng dụng
    APP_NAME: str = "VIC AI Service"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS - cho phép truy cập từ frontend và backend
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Đường dẫn model đã train
    MODEL_PATH: str = "models/active_model.pt"

    # Ollama LLM - mô hình ngôn ngữ tự host
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    # Gemini LLM (Google AI) - Trợ lý phân tích
    GEMINI_API_KEY: str = "" # Sẽ đọc từ file .env
    GEMINI_MODEL_NAME: str = "gemini-1.5-flash"

    # Tham số điều chỉnh dự báo theo tin tức
    ALPHA: float = 0.3  # Mức ảnh hưởng sentiment lên μ
    BETA: float = 0.2   # Mức ảnh hưởng sentiment lên σ

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
