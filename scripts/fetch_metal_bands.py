#!/usr/bin/env python3
"""
Récupère des groupes metal via Last.fm + MusicBrainz.

Optimisations anti-rate-limit :
  - User-Agent conforme aux recommandations officielles MusicBrainz
  - Paramètre ?fmt=json explicite
  - Cache local des MBID (évite les requêtes redondantes)
  - Délai par défaut de 3.0s + jitter aléatoire
  - Retry avec backoff exponentiel

Usage:
  python fetch_metal_bands.py                        # 10 000 groupes (délai 3s)
  python fetch_metal_bands.py --limit 500            # 500 groupes
  python fetch_metal_bands.py --mb-delay 4           # Délai MusicBrainz 4s (ultra-safe)
  python fetch_metal_bands.py --skip-musicbrainz     # Sans MusicBrainz (plus rapide)
  python fetch_metal_bands.py --resume               # Reprendre après interruption
  python fetch_metal_bands.py --reset --clear-mb-cache # Tout remettre à zéro
"""

import os
import json
import time
import re
import random
import argparse
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, List, Set, Tuple
from tqdm import tqdm
from dotenv import load_dotenv

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════

load_dotenv(Path(__file__).parent.parent / '.env')

LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')
LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/'
MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2/'

DEFAULT_OUTPUT = '../data/metal_bands.json'
DEFAULT_LIMIT = 10000
DEFAULT_LANG = 'fr'
MIN_BIO_LENGTH = 100

# 🎯 Rate limiting optimisé et safe
LASTFM_DELAY = 0.25              
DEFAULT_MB_DELAY = 3.0           # 3.0s par défaut pour éviter tout blocage
MB_CACHE_FILE = '../data/mbid_cache.json'
PROGRESS_FILE = '../data/fetch_progress.json'

# ═══════════════════════════════════════════════════════════
# SOUS-GENRES METAL
# ═══════════════════════════════════════════════════════════

METAL_TAGS = [
    'heavy metal', 'thrash metal', 'death metal', 'black metal',
    'power metal', 'doom metal', 'progressive metal', 'folk metal',
    'symphonic metal', 'gothic metal', 'nu metal', 'metalcore',
    'groove metal', 'industrial metal', 'speed metal',
    'melodic death metal', 'brutal death metal', 'technical death metal',
    'viking metal', 'pagan metal', 'sludge metal', 'stoner metal',
    'post-metal', 'djent', 'grindcore', 'deathcore',
    'swedish death metal', 'finnish death metal', 'norwegian black metal',
    'symphonic black metal', 'epic metal', 'true metal',
]

METAL_GENRES = {
    'black metal', 'death metal', 'thrash metal', 'heavy metal',
    'power metal', 'doom metal', 'progressive metal', 'folk metal',
    'symphonic metal', 'gothic metal', 'nu metal', 'metalcore',
    'groove metal', 'industrial metal', 'speed metal', 'grindcore',
    'deathcore', 'sludge metal', 'stoner metal', 'viking metal',
    'pagan metal', 'post-metal', 'djent', 'melodic death metal',
    'brutal death metal', 'technical death metal', 'epic metal',
    'true metal', 'swedish death metal', 'finnish death metal',
    'norwegian black metal', 'symphonic black metal',
}

TAG_TO_COUNTRY = {
    'swedish': 'Sweden', 'norwegian': 'Norway', 'finnish': 'Finland',
    'danish': 'Denmark', 'icelandic': 'Iceland', 'german': 'Germany',
    'french': 'France', 'british': 'United Kingdom', 'english': 'United Kingdom',
    'american': 'United States', 'canadian': 'Canada', 'australian': 'Australia',
    'brazilian': 'Brazil', 'japanese': 'Japan', 'polish': 'Poland',
    'russian': 'Russia', 'greek': 'Greece', 'italian': 'Italy',
    'spanish': 'Spain', 'portuguese': 'Portugal', 'dutch': 'Netherlands',
    'belgian': 'Belgium', 'swiss': 'Switzerland', 'austrian': 'Austria',
    'hungarian': 'Hungary', 'czech': 'Czechia', 'romanian': 'Romania',
    'ukrainian': 'Ukraine', 'israeli': 'Israel', 'turkish': 'Turkey',
    'mexican': 'Mexico', 'argentine': 'Argentina', 'chilean': 'Chile',
    'colombian': 'Colombia', 'chinese': 'China', 'korean': 'South Korea',
    'indian': 'India', 'south african': 'South Africa',
    'scandinavian': 'Sweden', 'baltic': 'Latvia',
}

# ═══════════════════════════════════════════════════════════
# CACHE LOCAL MBID
# ═══════════════════════════════════════════════════════════

class MBIDCache:
    def __init__(self, cache_path: str):
        self.cache_path = Path(cache_path)
        self.cache: Dict[str, Dict] = {}
        self.hits = 0
        self.misses = 0
        self._load()
    
    def _load(self):
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r', encoding='utf-8') as f:
                    self.cache = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.cache = {}
    
    def save(self):
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_path, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False)
    
    def get(self, mbid: str) -> Optional[Dict]:
        if mbid in self.cache:
            self.hits += 1
            return self.cache[mbid]
        self.misses += 1
        return None
    
    def set(self, mbid: str, data: Dict):
        self.cache[mbid] = data
    
    def stats(self) -> Dict[str, int]:
        return {'hits': self.hits, 'misses': self.misses, 'size': len(self.cache)}

# ═══════════════════════════════════════════════════════════
# CLIENT LAST.FM
# ═══════════════════════════════════════════════════════════

class LastFmClient:
    def __init__(self, api_key: str, default_lang: str = 'fr'):
        self.api_key = api_key
        self.default_lang = default_lang
        self.session = requests.Session()
        self.request_count = 0
        self.stats = {'bio_fr': 0, 'bio_en': 0, 'bio_none': 0}
        
    def _request(self, params: Dict) -> Optional[Dict]:
        params['api_key'] = self.api_key
        params['format'] = 'json'
        for attempt in range(3):
            try:
                time.sleep(LASTFM_DELAY)
                response = self.session.get(LASTFM_API_URL, params=params, timeout=15)
                self.request_count += 1
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    time.sleep(60 * (attempt + 1))
                else:
                    return None
            except requests.RequestException:
                time.sleep(2)
        return None
    
    def get_top_artists_by_tag(self, tag: str, limit: int = 100, page: int = 1) -> List[Dict]:
        data = self._request({'method': 'tag.gettopartists', 'tag': tag, 'limit': limit, 'page': page})
        if not data: return []
        artists = data.get('topartists', {}).get('artist', [])
        return artists if isinstance(artists, list) else []
    
    def get_artist_info(self, artist_name: str, lang: Optional[str] = None) -> Optional[Dict]:
        params = {'method': 'artist.getinfo', 'artist': artist_name, 'autocorrect': 1}
        if lang: params['lang'] = lang
        data = self._request(params)
        return data.get('artist') if data else None
    
    def get_artist_info_with_fallback(self, artist_name: str, preferred_lang: str = 'fr', fallback_lang: str = 'en') -> Tuple[Optional[Dict], str]:
        artist_data = self.get_artist_info(artist_name, lang=preferred_lang)
        if artist_data:
            bio_clean = clean_biography(artist_data.get('bio', {}).get('content', ''))
            if len(bio_clean) >= MIN_BIO_LENGTH:
                return artist_data, preferred_lang
        
        if preferred_lang != fallback_lang:
            artist_data_fallback = self.get_artist_info(artist_name, lang=fallback_lang)
            if artist_data_fallback:
                bio_clean = clean_biography(artist_data_fallback.get('bio', {}).get('content', ''))
                if len(bio_clean) >= MIN_BIO_LENGTH:
                    return artist_data_fallback, fallback_lang
        return artist_data, 'none'

# ═══════════════════════════════════════════════════════════
# CLIENT MUSICBRAINZ (Optimisé et Blindé)
# ═══════════════════════════════════════════════════════════

class MusicBrainzClient:
    def __init__(self, mb_delay: float = DEFAULT_MB_DELAY, use_cache: bool = True):
        self.mb_delay = mb_delay
        self.session = requests.Session()
        
        # User-Agent STRICTEMENT conforme à la doc officielle MusicBrainz
        self.session.headers.update({
            'User-Agent': 'MetalPedia/1.0.0 ( https://github.com/sebastienbats/MetalPedia ; mailto:contact@metalpedia.dev )',
            'Accept': 'application/json',
        })
        
        self.request_count = 0
        self.cache_hits = 0
        self.rate_limited_count = 0
        self.cache = MBIDCache(MB_CACHE_FILE) if use_cache else None
        self.current_backoff = mb_delay
        self.max_backoff = 120.0

    def get_artist(self, mbid: str) -> Optional[Dict]:
        if not mbid:
            return None
        
        if self.cache:
            cached = self.cache.get(mbid)
            if cached is not None:
                self.cache_hits += 1
                return cached
        
        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                # Jitter de ±20% pour éviter les patterns de requêtes
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)
                
                # 🆕 Ajout explicite de ?fmt=json
                url = f"{MUSICBRAINZ_API_URL}artist/{mbid}?fmt=json"
                response = self.session.get(url, timeout=15)
                self.request_count += 1
                
                if response.status_code == 200:
                    self.current_backoff = self.mb_delay
                    data = response.json()
                    if self.cache:
                        self.cache.set(mbid, data)
                        if len(self.cache.cache) % 50 == 0:
                            self.cache.save()
                    return data
                
                elif response.status_code == 404:
                    self.current_backoff = self.mb_delay
                    return None
                
                elif response.status_code in (503, 429):
                    self.rate_limited_count += 1
                    self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
                    retry_after = response.headers.get('Retry-After')
                    wait_time = int(retry_after) if retry_after else int(self.current_backoff)
                    
                    print(f"\n⚠️  Rate limit MusicBrainz ({response.status_code}) - "
                          f"Tentative {attempt + 1}/{max_attempts} - Attente de {wait_time}s")
                    
                    if attempt == max_attempts - 1:
                        print(f"❌ Abandon après {max_attempts} tentatives pour MBID {mbid[:8]}...")
                        return None
                    time.sleep(wait_time)
                else:
                    return None
            except requests.RequestException:
                time.sleep(2)
        return None

    def extract_country_and_formed(self, mbid: str) -> Tuple[Optional[str], Optional[int]]:
        artist_data = self.get_artist(mbid)
        if not artist_data:
            return None, None
        
        country = artist_data.get('country')
        if country:
            country = iso_to_country_name(country)
        
        formed = None
        life_span = artist_data.get('life_span', {})
        begin_date = life_span.get('begin', '')
        if begin_date:
            try:
                year = int(begin_date[:4])
                if 1960 <= year <= datetime.now().year:
                    formed = year
            except (ValueError, TypeError):
                pass
        return country, formed

    def save_cache(self):
        if self.cache:
            self.cache.save()
            print(f"💾 Cache MBID sauvegardé : {len(self.cache.cache)} entrées")

    # 🆕 PROPRIÉTÉ pour corriger le bug AttributeError
    @property
    def stats(self) -> Dict[str, int]:
        return {
            'found': self.cache.stats()['size'] if self.cache else 0,
            'cache_hits': self.cache_hits,
            'rate_limited': self.rate_limited_count,
            'api_requests': self.request_count,
        }

# ═══════════════════════════════════════════════════════════
# UTILITAIRES ET TRAITEMENT
# ═══════════════════════════════════════════════════════════

ISO_TO_COUNTRY = {
    'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AR': 'Argentina',
    'AU': 'Australia', 'AT': 'Austria', 'BE': 'Belgium', 'BR': 'Brazil',
    'BG': 'Bulgaria', 'CA': 'Canada', 'CL': 'Chile', 'CN': 'China',
    'CO': 'Colombia', 'HR': 'Croatia', 'CZ': 'Czechia', 'DK': 'Denmark',
    'EE': 'Estonia', 'FI': 'Finland', 'FR': 'France', 'DE': 'Germany',
    'GR': 'Greece', 'HU': 'Hungary', 'IS': 'Iceland', 'IN': 'India',
    'IE': 'Ireland', 'IL': 'Israel', 'IT': 'Italy', 'JP': 'Japan',
    'LV': 'Latvia', 'LT': 'Lithuania', 'MX': 'Mexico', 'NL': 'Netherlands',
    'NZ': 'New Zealand', 'NO': 'Norway', 'PL': 'Poland', 'PT': 'Portugal',
    'RO': 'Romania', 'RU': 'Russia', 'RS': 'Serbia', 'SK': 'Slovakia',
    'SI': 'Slovenia', 'ZA': 'South Africa', 'ES': 'Spain', 'SE': 'Sweden',
    'CH': 'Switzerland', 'TR': 'Turkey', 'UA': 'Ukraine', 'GB': 'United Kingdom',
    'US': 'United States',
}

def iso_to_country_name(iso_code: str) -> str:
    if not iso_code: return 'Unknown'
    return ISO_TO_COUNTRY.get(iso_code.upper(), iso_code)

def extract_country_from_tags(tags: List[Dict]) -> Optional[str]:
    for tag in tags:
        tag_name = tag.get('name', '').lower()
        for keyword, country in TAG_TO_COUNTRY.items():
            if keyword in tag_name:
                return country
    return None

def extract_genre_from_tags(tags: List[Dict]) -> str:
    for tag in tags:
        tag_name = tag.get('name', '').lower()
        if tag_name in METAL_GENRES:
            return tag_name.title()
    return 'Metal'

def clean_biography(bio_content: str) -> str:
    if not bio_content: return ''
    clean = re.sub(r'<[^>]+>', '', bio_content)
    clean = re.sub(r'\s*(?:Read more|Lire la suite|Mehr lesen|Más información|Leggi tutto).*$', '', clean, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'https?://www\.last\.fm[^\s]*', '', clean)
    return re.sub(r'\s+', ' ', clean).strip()[:2000]

def process_artist(artist_data: Dict, source_tag: str, bio_lang: str, musicbrainz_client: Optional[MusicBrainzClient] = None) -> Optional[Dict]:
    if not artist_data: return None
    name = artist_data.get('name', '').strip()
    if not name: return None
    
    tags = artist_data.get('tags', {}).get('tag', [])
    if not isinstance(tags, list): tags = []
    
    genre = extract_genre_from_tags(tags)
    biography = clean_biography(artist_data.get('bio', {}).get('content', ''))
    
    images = artist_data.get('image', [])
    image_url = next((img['#text'] for img in reversed(images) if img.get('#text')), None)
    
    try:
        listeners = int(artist_data.get('stats', {}).get('listeners', 0) or 0)
    except (ValueError, TypeError):
        listeners = 0
    
    country, country_source = None, None
    formed, formed_source = None, None
    mbid = artist_data.get('mbid', '').strip()
    
    if musicbrainz_client and mbid:
        mb_country, mb_formed = musicbrainz_client.extract_country_and_formed(mbid)
        if mb_country:
            country, country_source = mb_country, 'musicbrainz'
        if mb_formed:
            formed, formed_source = mb_formed, 'musicbrainz'
    
    if not country:
        tag_country = extract_country_from_tags(tags)
        if tag_country:
            country, country_source = tag_country, 'lastfm_tags'
    
    if not country:
        country, country_source = 'Unknown', 'unknown'
    if not formed_source:
        formed_source = 'unknown'
    
    return {
        'name': name, 'genre': genre, 'country': country, 'country_source': country_source,
        'formed': formed, 'formed_source': formed_source, 'mbid': mbid or None,
        'status': 'Active', 'biography': biography or None, 'bio_lang': bio_lang,
        'image_url': image_url, 'listeners': listeners, 'source_tag': source_tag,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
    }

# ═══════════════════════════════════════════════════════════
# GESTION DE LA PROGRESSION
# ═══════════════════════════════════════════════════════════

def load_progress(path: str) -> Dict:
    if not Path(path).exists(): return {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 0}
    try:
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)
    except: return {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 0}

def save_progress(path: str, progress: Dict):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: json.dump(progress, f, ensure_ascii=False)

def reset_progress(path: str):
    if Path(path).exists():
        Path(path).unlink()
        print("🗑️  Progression réinitialisée")

# ═══════════════════════════════════════════════════════════
# FONCTION PRINCIPALE DE RÉCUPÉRATION
# ═══════════════════════════════════════════════════════════

def fetch_all_metal_bands(limit: int, resume: bool, progress_path: str, preferred_lang: str, use_musicbrainz: bool, mb_delay: float) -> Tuple[List[Dict], Dict, Dict]:
    if not LASTFM_API_KEY:
        print("❌ Erreur: LASTFM_API_KEY non définie dans .env")
        return [], {}, {}
    
    lastfm_client = LastFmClient(LASTFM_API_KEY, default_lang=preferred_lang)
    musicbrainz_client = MusicBrainzClient(mb_delay=mb_delay, use_cache=use_musicbrainz) if use_musicbrainz else None
    
    if resume:
        progress = load_progress(progress_path)
        seen_names = set(progress.get('seen_names', []))
        bands_list = progress.get('bands', [])
        start_tag_idx = progress.get('last_tag_index', 0)
        start_page = progress.get('last_page', 0)
        print(f"\n🔄 Reprise depuis le tag {start_tag_idx}, page {start_page} ({len(bands_list)} groupes)")
    else:
        progress = {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 0}
        seen_names, bands_list = set(), []
        start_tag_idx, start_page = 0, 0
    
    print(f"\n🎸 Démarrage de la récupération de {limit} groupes...")
    print(f"📊 {len(METAL_TAGS)} sous-genres | 🌍 Langue: {preferred_lang.upper()}")
    if use_musicbrainz:
        print(f"🎵 MusicBrainz: ACTIVÉ (délai: {mb_delay}s + jitter)")
    
    for tag_idx, tag in enumerate(tqdm(METAL_TAGS[start_tag_idx:], desc="Genres", initial=start_tag_idx)):
        actual_tag_idx = start_tag_idx + tag_idx
        page = start_page if tag_idx == 0 else 1
        
        while page <= 5 and len(bands_list) < limit:
            artists = lastfm_client.get_top_artists_by_tag(tag, limit=100, page=page)
            if not artists: break
            
            for artist in artists:
                if len(bands_list) >= limit: break
                artist_name = artist.get('name', '').strip()
                if not artist_name or artist_name in seen_names: continue
                
                seen_names.add(artist_name)
                artist_info, actual_lang = lastfm_client.get_artist_info_with_fallback(artist_name, preferred_lang, 'en')
                
                if artist_info:
                    lastfm_client.stats[f'bio_{preferred_lang}' if actual_lang == preferred_lang else ('bio_en' if actual_lang == 'en' else 'bio_none')] += 1
                    processed = process_artist(artist_info, tag, actual_lang, musicbrainz_client)
                    if processed: bands_list.append(processed)
            
            progress.update({'seen_names': list(seen_names), 'bands': bands_list, 'last_tag_index': actual_tag_idx, 'last_page': page})
            save_progress(progress_path, progress)
            page += 1
        start_page = 0
    
    if musicbrainz_client: musicbrainz_client.save_cache()
    
    print(f"\n✅ Récupération terminée ! {len(bands_list)} groupes uniques.")
    print(f"🌐 Last.fm: {lastfm_client.request_count} req | 🎵 MusicBrainz: {musicbrainz_client.request_count if musicbrainz_client else 0} req")
    if musicbrainz_client:
        cs = musicbrainz_client.cache.stats() if musicbrainz_client.cache else {}
        print(f"💾 Cache: {cs.get('hits', 0)} hits / {cs.get('misses', 0)} misses | ⚠️ Rate limits: {musicbrainz_client.rate_limited_count}")
    
    return bands_list, lastfm_client.stats, musicbrainz_client.stats if musicbrainz_client else {}

def save_to_json(bands: List[Dict], output_path: str, lastfm_stats: Dict, mb_stats: Dict, lang: str):
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {'total_bands': len(bands), 'fetched_at': datetime.now(timezone.utc).isoformat(), 'source': 'Last.fm + MusicBrainz', 'preferred_lang': lang},
            'bands': bands
        }, f, ensure_ascii=False, indent=2)
    print(f"💾 Sauvegardé dans {output_path} ({path.stat().st_size / 1024:.1f} KB)")

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Récupération MetalPedia optimisée')
    parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT)
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT)
    parser.add_argument('--lang', type=str, default=DEFAULT_LANG)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--reset', action='store_true')
    parser.add_argument('--skip-musicbrainz', action='store_true')
    parser.add_argument('--mb-delay', type=float, default=DEFAULT_MB_DELAY, help='Délai MusicBrainz (défaut: 3.0s)')
    parser.add_argument('--clear-mb-cache', action='store_true', help='Vider le cache MBID')
    args = parser.parse_args()

    print("\n" + "="*60 + "\n🎸 METALPEDIA - Récupération Last.fm + MusicBrainz\n" + "="*60)
    
    if args.reset: reset_progress(PROGRESS_FILE)
    if args.clear_mb_cache and Path(MB_CACHE_FILE).exists():
        Path(MB_CACHE_FILE).unlink()
        print("🗑️ Cache MBID vidé")
        return

    if args.lang not in {'fr', 'en', 'de', 'es', 'it', 'pl', 'pt', 'ru', 'sv', 'ja', 'zh'}:
        args.lang = 'fr'

    start_time = time.time()
    bands, lf_stats, mb_stats = fetch_all_metal_bands(
        args.limit, args.resume, PROGRESS_FILE, args.lang, not args.skip_musicbrainz, args.mb_delay
    )
    
    if bands:
        save_to_json(bands, args.output, lf_stats, mb_stats, args.lang)
    
    print(f"\n⏱️ Temps total: {(time.time() - start_time)/60:.1f} minutes\n")

if __name__ == '__main__':
    main()
