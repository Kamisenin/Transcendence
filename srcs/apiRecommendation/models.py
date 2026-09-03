from pydantic import BaseModel


class RecommendationEvent(BaseModel):
    user_id: str
    page_id: int
    event: str

class PageReaction(BaseModel):
    user_id: str
    page_id: int
    type: str