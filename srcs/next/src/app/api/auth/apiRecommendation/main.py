from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import RecommendationEvent
from event import process_event
from recommendation import get_recommendations

app = FastAPI(title="Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permet l'accès en dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# EVENT
# ============================================================

@app.post("/recommendation/event")
def recommendation_event(data: RecommendationEvent):
    process_event(
        user_id=data.user_id,
        page_id=data.page_id,
        event=data.event
    )
    return {"status": "ok"}


# ============================================================
# RECOMMENDATION
# ============================================================

@app.get("/recommendation")
def recommendation(user_id: str):
    recommendations = get_recommendations(user_id)
    return {
        "user_id": user_id,
        "recommendations": recommendations
    }