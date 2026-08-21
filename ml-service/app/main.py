from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

from .spotify_client import SpotifyClient
from .embeddings import BandEmbedder
from .recommendations import RecommendationEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MetalPedia ML Service",
    version="3.0.0",
    description="Moteur de recommandations ML et embeddings Spotify pour MetalPedia",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

spotify = SpotifyClient()
embedder = BandEmbedder(spotify)
engine = RecommendationEngine(embedder)


class BandInput(BaseModel):
    band_id: int
    name: str
    genre: str
    country: str
    formed: Optional[str] = None


class SimilarBandsRequest(BaseModel):
    band: BandInput
    limit: int = Field(default=10, le=50)


class RecommendationRequest(BaseModel):
    user_history: List[BandInput]
    target_genre: Optional[str] = None
    limit: int = Field(default=10, le=50)


class AudioFeaturesRequest(BaseModel):
    band_name: str


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "spotify_connected": spotify.is_authenticated(),
        "cache_size": embedder.get_cache_size(),
    }


@app.post("/similar-bands")
async def get_similar_bands(request: SimilarBandsRequest, background_tasks: BackgroundTasks):
    try:
        similar = await engine.find_similar(band=request.band, limit=request.limit)
        background_tasks.add_task(embedder.prefetch_embeddings, request.band)
        return {
            "source_band": request.band.name,
            "recommendations": similar,
        }
    except Exception as e:
        logger.error(f"Similar bands error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    try:
        recommendations = await engine.personalized_recommendations(
            history=request.user_history,
            target_genre=request.target_genre,
            limit=request.limit
        )
        return {"count": len(recommendations), "recommendations": recommendations}
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/audio-features")
async def get_audio_features(request: AudioFeaturesRequest):
    try:
        features = await spotify.get_band_audio_features(request.band_name)
        if not features:
            raise HTTPException(status_code=404, detail="Band not found on Spotify")
        return features
    except Exception as e:
        logger.error(f"Audio features error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
