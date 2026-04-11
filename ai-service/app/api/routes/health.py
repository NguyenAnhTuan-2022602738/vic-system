"""
Endpoint kiểm tra sức khỏe hệ thống.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Kiểm tra trạng thái hoạt động của AI service."""
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "vic-ai-service",
        },
    }
