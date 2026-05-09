from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.assistant_service import assistant_service
from app.core.dependencies import get_forecast_service
from app.core.logger import logger

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    status: str = "success"

@router.post("/assistant/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    forecast_service=Depends(get_forecast_service)
):
    """Giao diện chat với AI Assistant."""
    try:
        # Nếu người dùng không gửi bối cảnh, hãy tự lấy từ hệ thống
        context = request.context
        if not context:
            context = await forecast_service.get_context_summary()
            
        answer = assistant_service.chat(request.message, context)
        return ChatResponse(answer=answer)
    except Exception as e:
        logger.error(f"Error in chat route: {e}")
        raise HTTPException(status_code=500, detail=str(e))

