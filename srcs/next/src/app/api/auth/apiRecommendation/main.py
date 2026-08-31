from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from models import RecommendationEvent
from event import process_event
from recommendation import get_recommendations
from statistics import update_tag_statistics


# ------------------------------------------------------------
# CRON : Recalcul toutes les minutes
# ------------------------------------------------------------
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Exécution immédiate au démarrage pour être certain d'avoir des stats à jour
    try:
        update_tag_statistics()
        print("✅ Statistiques des tags initiales calculées au démarrage.")
    except Exception as e:
        print(f"⚠️ Erreur lors du premier calcul de stats: {e}")

    # Démarrage du cron au lancement de FastAPI
    scheduler.add_job(update_tag_statistics, 'interval', minutes=1, id='update_idf_job')
    scheduler.start()
    print("⏰ Cron démarré : recalcul des statistiques tags toutes les minutes.")
    
    yield
    
    # Arrêt propre du scheduler à la fermeture de l'app
    scheduler.shutdown()
    print("🛑 Cron arrêté.")


# ------------------------------------------------------------
# FASTAPI APP
# ------------------------------------------------------------
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