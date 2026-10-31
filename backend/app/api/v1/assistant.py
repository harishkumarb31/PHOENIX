from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services.ai_assistant import assistant
from ...schemas.all_schemas import AssistantQueryRequest

router = APIRouter(prefix="/assistant", tags=["AI Operations Assistant"])

@router.post("/query")
def ask_assistant(payload: AssistantQueryRequest, db: Session = Depends(get_db)):
    result = assistant.answer_query(payload.query, db)
    return result
