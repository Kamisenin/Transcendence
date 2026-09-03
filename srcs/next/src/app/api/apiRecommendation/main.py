from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from models import RecommendationEvent, PageReaction
from reaction import set_reaction, delete_reaction, get_favorites, get_reaction
from event import process_event
from recommendation import get_recommendations
from statistics import update_tag_statistics
from fastapi import FastAPI, HTTPException



# ============================================================
# CRON
# ============================================================
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        update_tag_statistics()
    except Exception as e:
        print(f"Erreur: {e}")

    scheduler.add_job(update_tag_statistics, 'interval', minutes=1, id='update_idf_job')
    scheduler.start()
    
    yield
    
    scheduler.shutdown()


# ============================================================
# FASTAPI APP
# ============================================================
app = FastAPI(title="Recommendation API", lifespan=lifespan)

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

    print("EVENT RECEIVED:", data.event)
    print("USER:", data.user_id)
    print("PAGE:", data.page_id)

    if data.event == "visit":
        process_event(
            user_id=data.user_id,
            page_id=data.page_id,
            event="visit"
        )

    elif data.event == "favorite":
        print("SETTING FAVORITE")

        set_reaction(
            user_id=data.user_id,
            page_id=data.page_id,
            reaction="FAVORITE"
        )

        process_event(
            user_id=data.user_id,
            page_id=data.page_id,
            event="favorite"
        )

    elif data.event == "dislike":
        print("SETTING DISLIKE")

        set_reaction(
            user_id=data.user_id,
            page_id=data.page_id,
            reaction="DISLIKE"
        )

        process_event(
            user_id=data.user_id,
            page_id=data.page_id,
            event="dislike"
        )

    elif data.event == "cancel_favorite":

        print("CANCELING FAVORITE")

        delete_reaction(
            user_id=data.user_id,
            page_id=data.page_id
        )

        process_event(
            user_id=data.user_id,
            page_id=data.page_id,
            event="cancel_favorite"
        )

    elif data.event == "cancel_dislike":

        print("CANCELING DISLIKE")

        delete_reaction(
            user_id=data.user_id,
            page_id=data.page_id
        )

        process_event(
            user_id=data.user_id,
            page_id=data.page_id,
            event="cancel_dislike"
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown event: {data.event}"
        )

    print("EVENT PROCESSED")

    return {"status": "ok"}


# ============================================================
# REACTION
# ============================================================

@app.post("/recommendation/reaction")
def recommendation_reaction(data: PageReaction):
    set_reaction(
        user_id=data.user_id,
        page_id=data.page_id,
        reaction=data.type
    )
    return {"status": "ok"}


@app.delete("/recommendation/reaction")
def recommendation_delete_reaction(data: PageReaction):
    delete_reaction(
        user_id=data.user_id,
        page_id=data.page_id
    )
    return {"status": "ok"}

@app.get("/recommendation/reaction")
def recommendation_get_reaction(user_id: str, page_id: int):

    reaction = get_reaction(
        user_id=user_id,
        page_id=page_id
    )

    return {
        "user_id": user_id,
        "page_id": page_id,
        "reaction": reaction
    }


# ============================================================
# RECOMMENDATION
# ============================================================

@app.get("/recommendation")
def recommendation(user_id: str, page_id: int | None = None):

    print("DEBUG user_id:", user_id)
    print("DEBUG current page_id:", page_id)

    recommendations = get_recommendations(
        user_id,
        current_page_id=page_id
    )

    return {
        "user_id": user_id,
        "current_page_id": page_id,
        "recommendations": recommendations
    }

@app.get("/recommendation/favorites")
def favorites(user_id: str):
    return {
        "user_id": user_id,
        "favorites": get_favorites(user_id)
    }