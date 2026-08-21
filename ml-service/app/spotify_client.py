import os
import asyncio
from typing import Optional, Dict, List
from spotipy import Spotify
from spotipy.oauth2 import SpotifyClientCredentials
from functools import lru_cache


class SpotifyClient:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.sp = None

        if self.client_id and self.client_secret:
            auth = SpotifyClientCredentials(
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            self.sp = Spotify(auth_manager=auth)

    def is_authenticated(self) -> bool:
        return self.sp is not None

    @lru_cache(maxsize=1000)
    def _search_artist_sync(self, name: str) -> Optional[str]:
        if not self.sp:
            return None
        try:
            results = self.sp.search(q=f'artist:{name}', type='artist', limit=1)
            artists = results.get('artists', {}).get('items', [])
            return artists[0]['id'] if artists else None
        except Exception:
            return None

    async def search_artist(self, name: str) -> Optional[str]:
        return await asyncio.to_thread(self._search_artist_sync, name)

    def _get_artist_top_tracks_sync(self, artist_id: str) -> List[str]:
        if not self.sp:
            return []
        try:
            tracks = self.sp.artist_top_tracks(artist_id, country='US')
            return [t['id'] for t in tracks['tracks'][:10]]
        except Exception:
            return []

    def _get_audio_features_sync(self, track_ids: List[str]) -> List[Dict]:
        if not self.sp or not track_ids:
            return []
        try:
            features = self.sp.audio_features(track_ids)
            return [f for f in features if f]
        except Exception:
            return []

    async def get_band_audio_features(self, band_name: str) -> Optional[Dict]:
        artist_id = await self.search_artist(band_name)
        if not artist_id:
            return None

        track_ids = await asyncio.to_thread(self._get_artist_top_tracks_sync, artist_id)
        if not track_ids:
            return None

        features_list = await asyncio.to_thread(self._get_audio_features_sync, track_ids)
        if not features_list:
            return None

        aggregated = self._aggregate_features(features_list)
        aggregated['artist_id'] = artist_id
        aggregated['track_count'] = len(features_list)
        return aggregated

    def _aggregate_features(self, features_list: List[Dict]) -> Dict:
        keys = ['danceability', 'energy', 'key', 'loudness', 'mode',
                'speechiness', 'acousticness', 'instrumentalness',
                'liveness', 'valence', 'tempo']
        aggregated = {}
        for key in keys:
            values = [f[key] for f in features_list if f.get(key) is not None]
            if values:
                aggregated[key] = sum(values) / len(values)
        return aggregated
