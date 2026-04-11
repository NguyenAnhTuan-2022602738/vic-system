"""
Cấu hình logging cho AI Service.
"""

import logging
import sys


def setup_logger(name: str = "vic-ai") -> logging.Logger:
    """Khởi tạo và trả về logger đã cấu hình."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Handler xuất log ra console
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)

    # Định dạng: thời gian | mức độ | tên | nội dung
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(handler)

    return logger


logger = setup_logger()
