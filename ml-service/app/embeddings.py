import numpy as np
from typing import Optional, Dict, List
from functools import lru_cache


class BandEmbedder:
    AUDIO_DIMS = 11
    META_DIMS = 11
    TOTAL_DIMS = AUDIO_DIMS + META_DIMS

    def __init__(self, spotify_client):
        self.spotify = spotify_client
        self.genre_index = self._build_genre_index()

    def _build_genre_index(self) -> Dict[str, int]:
        genres = [
            'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal',
            'Power Metal', 'Doom Metal', 'Progressive Metal', 'Folk Metal',
            'Symphonic Metal', 'Gothic Metal'
        ]
        return {g: i for i, g in enumerate(genres)}

    async def get_embedding(self, band_name: str) -> Optional[List[float]]:
        audio = await self.spotify.get_band_audio_features(band_name)
        if not audio:
            return None

        audio_vector = np.array([
            audio.get('danceability', 0.5),
            audio.get('energy', 0.5),
            audio.get('key', 6) / 12,
            audio.get('loudness', -20) / 60 + 1,
            audio.get('mode', 0.5),
            audio.get('speechiness', 0.1),
            audio.get('acousticness', 0.3),
            audio.get('instrumentalness', 0.1),
            audio.get('liveness', 0.2),
            audio.get('valence', 0.5),
            audio.get('tempo', 120) / 200,
        ])
        return audio_vector.tolist()

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        v1, v2 = np.array(vec1), np.array(vec2)
        norm1, norm2 = np.linalg.norm(v1), np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    @lru_cache(maxsize=500)
    def get_cached_embedding(self, band_name: str):
        return None

    def get_cache_size(self) -> int:
        return self.get_cached_embedding.cache_info().currsize
