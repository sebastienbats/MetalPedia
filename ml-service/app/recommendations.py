from typing import List, Dict, Optional
from pydantic import BaseModel


class Band(BaseModel):
    band_id: int
    name: str
    genre: str
    country: str
    formed: Optional[str] = None


class RecommendationEngine:
    def __init__(self, embedder):
        self.embedder = embedder

    async def find_similar(self, band: Band, limit: int = 10) -> List[Dict]:
        source_embedding = await self.embedder.get_embedding(band.name)
        if not source_embedding:
            return self._fallback_recommendations(band, limit)
        return self._fallback_recommendations(band, limit)

    def _fallback_recommendations(self, band: Band, limit: int) -> List[Dict]:
        genre_matches = {
            'Black Metal': [
                {'name': 'Darkthrone', 'country': 'Norway', 'genre': 'Black Metal'},
                {'name': 'Mayhem', 'country': 'Norway', 'genre': 'Black Metal'},
                {'name': 'Burzum', 'country': 'Norway', 'genre': 'Black Metal'},
            ],
            'Death Metal': [
                {'name': 'Death', 'country': 'USA', 'genre': 'Death Metal'},
                {'name': 'Morbid Angel', 'country': 'USA', 'genre': 'Death Metal'},
                {'name': 'Cannibal Corpse', 'country': 'USA', 'genre': 'Death Metal'},
            ],
            'Heavy Metal': [
                {'name': 'Iron Maiden', 'country': 'UK', 'genre': 'Heavy Metal'},
                {'name': 'Judas Priest', 'country': 'UK', 'genre': 'Heavy Metal'},
                {'name': 'Black Sabbath', 'country': 'UK', 'genre': 'Heavy Metal'},
            ],
        }
        matches = genre_matches.get(band.genre, [])[:limit]
        return [
            {
                'name': m['name'],
                'genre': m['genre'],
                'country': m['country'],
                'similarity_score': 0.85 - i * 0.05,
            }
            for i, m in enumerate(matches)
        ]

    async def personalized_recommendations(
        self,
        history: List[Band],
        target_genre: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        if not history:
            return []
        target = target_genre or history[0].genre
        return self._fallback_recommendations(
            Band(band_id=0, name='', genre=target, country=''),
            limit
        )

    async def prefetch_embeddings(self, band: Band):
        await self.embedder.get_embedding(band.name)
