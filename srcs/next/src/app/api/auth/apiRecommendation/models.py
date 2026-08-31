from pydantic import BaseModel


class RecommendationEvent(BaseModel):
    user_id: str
    page_id: int
    event: str