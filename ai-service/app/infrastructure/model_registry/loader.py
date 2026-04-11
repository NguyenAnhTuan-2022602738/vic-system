"""
Quản lý mô hình — lưu và tải mô hình đã train.
"""

import os
import shutil
from datetime import datetime

import torch
from app.core.logger import logger


def save_model(
    model: torch.nn.Module,
    path: str = "models/active_model.pt",
    archive: bool = True,
) -> str:
    """
    Lưu trọng số mô hình xuống ổ đĩa.
    Có thể tự động lưu trữ mô hình cũ.

    Tham số:
        model: Mô hình PyTorch
        path: Đường dẫn lưu
        archive: Có lưu trữ mô hình cũ không

    Trả về:
        Đường dẫn nơi mô hình đã được lưu
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)

    # Lưu trữ mô hình hiện tại nếu có
    if archive and os.path.exists(path):
        archive_dir = os.path.join(os.path.dirname(path), "archive")
        os.makedirs(archive_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_name = f"model_{timestamp}.pt"
        archive_path = os.path.join(archive_dir, archive_name)
        shutil.copy2(path, archive_path)
        logger.info(f"Mô hình trước đã lưu trữ: {archive_path}")

    torch.save(model.state_dict(), path)
    logger.info(f"Đã lưu mô hình: {path}")
    return path


def load_model(
    model_class: type,
    path: str = "models/active_model.pt",
    **model_kwargs,
) -> torch.nn.Module:
    """
    Tải trọng số mô hình từ ổ đĩa.

    Tham số:
        model_class: Lớp mô hình cần khởi tạo
        path: Đường dẫn tới file trọng số
        **model_kwargs: Tham số cho constructor mô hình

    Trả về:
        Mô hình đã tải ở chế độ eval
    """
    model = model_class(**model_kwargs)

    if os.path.exists(path):
        state_dict = torch.load(path, map_location="cpu", weights_only=True)
        model.load_state_dict(state_dict)
        logger.info(f"Đã tải mô hình từ {path}")
    else:
        logger.warning(f"Không tìm thấy mô hình tại {path}. Dùng mô hình chưa khởi tạo.")

    model.eval()
    return model
