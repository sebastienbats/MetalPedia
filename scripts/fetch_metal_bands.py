#!/usr/bin/env python3
"""
Récupère des groupes metal via Last.fm + MusicBrainz.

Optimisations anti-rate-limit :
  - User-Agent conforme aux recommandations officielles MusicBrainz
  - Cache local des MBID (évite les requêtes redondantes)
  - Délai configurable (défaut 2s)
  - Retry avec backoff exponentiel (2s → 4s → 8s → ...)
  - Statistiques détaillées des rate limits

Usage:
  python fetch_metal_bands.py                        # 10 000 groupes
  python fetch_metal_bands.py --limit 500            # 500 groupes
  python fetch_metal_bands.py --mb-delay 3           # Délai MusicBrainz 3s
  python fetch_metal_bands.py --skip-musicbrainz     # Sans MusicBrainz
  python fetch_metal_bands.py --resume               # Reprendre
"""

import os
import json
import time
import re
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

# 🎯 Rate limiting optimisé
LASTFM_DELAY = 0.25              # 4 req/sec pour Last.fm
DEFAULT_MB_DELAY = 2.0           # 🆕 2s par défaut (recommandé MusicBrainz)
MB_CACHE_FILE = '../data/mbid_cache.json'  # 🆕 Cache local des MBID

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

# ═══════════════════════════════════════════════════════════
# EXTRACTION DU PAYS DEPUIS LES TAGS (fallback)
# ═══════════════════════════════════════════════════════════

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

def extract_country_from_tags(tags: List[Dict]) -> Optional[str]:
    for tag in tags:
        tag_name = tag.get('name', '').lower()
        for keyword, country in TAG_TO_COUNTRY.items():
            if keyword in tag_name:
                return country
    return None

# ═══════════════════════════════════════════════════════════
# CACHE LOCAL MBID (pour éviter les requêtes redondantes)
# ═══════════════════════════════════════════════════════════

class MBIDCache:
    """
    Cache local des données MusicBrainz par MBID.
    Évite de re-interroger l'API pour un MBID déjà vu.
    Persiste sur disque pour être réutilisé entre les exécutions.
    """
    
    def __init__(self, cache_path: str):
        self.cache_path = Path(cache_path)
        self.cache: Dict[str, Dict] = {}
        self.hits = 0
        self.misses = 0
        self._load()
    
    def _load(self):
        """Charge le cache depuis le disque."""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r', encoding='utf-8') as f:
                    self.cache = json.load(f)
                print(f"💾 Cache MBID chargé : {len(self.cache)} entrées")
            except (json.JSONDecodeError, IOError):
                self.cache = {}
    
    def save(self):
        """Sauvegarde le cache sur le disque."""
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_path, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False)
    
    def get(self, mbid: str) -> Optional[Dict]:
        """Récupère les données depuis le cache."""
        if mbid in self.cache:
            self.hits += 1
            return self.cache[mbid]
        self.misses += 1
        return None
    
    def set(self, mbid: str, data: Dict):
        """Ajoute des données au cache."""
        self.cache[mbid] = data
    
    def stats(self) -> Dict[str, int]:
        return {'hits': self.hits, 'misses': self.misses, 'size': len(self.cache)}

# ═══════════════════════════════════════════════════════════
# CLIENT LAST.FM (inchangé)
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
                    wait_time = 60 * (attempt + 1)
                    print(f"\n⚠️  Rate limit Last.fm, attente de {wait_time}s...")
                    time.sleep(wait_time)
                elif response.status_code == 403:
                    print(f"\n❌ Clé API Last.fm invalide")
                    return None
                else:
                    return None
                    
            except requests.RequestException as e:
                print(f"\n⚠️  Erreur réseau Last.fm (tentative {attempt + 1}/3): {e}")
                time.sleep(2)
        
        return None
    
    def get_top_artists_by_tag(self, tag: str, limit: int = 100, page: int = 1) -> List[Dict]:
        params = {
            'method': 'tag.gettopartists',
            'tag': tag,
            'limit': limit,
            'page': page,
        }
        data = self._request(params)
        if not data:
            return []
        artists = data.get('topartists', {}).get('artist', [])
        return artists if isinstance(artists, list) else []
    
    def get_artist_info(self, artist_name: str, lang: Optional[str] = None) -> Optional[Dict]:
        params = {
            'method': 'artist.getinfo',
            'artist': artist_name,
            'autocorrect': 1,
        }
        if lang:
            params['lang'] = lang
        
        data = self._request(params)
        return data.get('artist') if data else None
    
    def get_artist_info_with_fallback(
        self, 
        artist_name: str, 
        preferred_lang: str = 'fr',
        fallback_lang: str = 'en'
    ) -> Tuple[Optional[Dict], str]:
        # 1. Langue préférée
        artist_data = self.get_artist_info(artist_name, lang=preferred_lang)
        if artist_data:
            bio_clean = clean_biography(artist_data.get('bio', {}).get('content', ''))
            if len(bio_clean) >= MIN_BIO_LENGTH:
                return artist_data, preferred_lang
        
        # 2. Fallback
        if preferred_lang != fallback_lang:
            artist_data_fallback = self.get_artist_info(artist_name, lang=fallback_lang)
            if artist_data_fallback:
                bio_clean = clean_biography(artist_data_fallback.get('bio', {}).get('content', ''))
                if len(bio_clean) >= MIN_BIO_LENGTH:
                    return artist_data_fallback, fallback_lang
        
        return artist_data, 'none'

# ═══════════════════════════════════════════════════════════
# CLIENT MUSICBRAINZ OPTIMISÉ
# ═══════════════════════════════════════════════════════════

class MusicBrainzClient:
    """
    Client MusicBrainz avec :
      - User-Agent conforme aux recommandations officielles
      - Cache local des MBID
      - Retry avec backoff exponentiel
      - Délai configurable
    """
    
    def __init__(self, mb_delay: float = DEFAULT_MB_DELAY, use_cache: bool = True):
        self.mb_delay = mb_delay
        self.session = requests.Session()
        
        # 🎯 User-Agent OPTIMISÉ selon les recommandations officielles MusicBrainz
        # Format : "ApplicationName/Version ( ContactURL )"
        # Voir : https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
        self.session.headers.update({
            'User-Agent': 'MetalPedia/1.0.0 ( https://github.com/sebastienbats/MetalPedia ; contact@metalpedia.dev )',
            'Accept': 'application/json',
        })
        
        self.request_count = 0
        self.cache_hits = 0
        self.rate_limited_count = 0
        
        # 🆕 Cache local pour éviter les requêtes redondantes
        self.cache = MBIDCache(MB_CACHE_FILE) if use_cache else None
        
        # 🆕 Backoff state
        self.current_backoff = mb_delay
        self.max_backoff = 120.0  # Maximum 2 minutes
    
    def get_artist(self, mbid: str) -> Optional[Dict]:
        """Récupère les infos d'un artiste avec cache + backoff."""
        if not mbid:
            return None
        
        # 🆕 Vérifier le cache d'abord
        if self.cache:
            cached = self.cache.get(mbid)
            if cached is not None:
                self.cache_hits += 1
                return cached
        
        # 🎯 Retry avec backoff exponentiel
        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                # Délai avec backoff progressif
                delay = min(self.current_backoff, self.max_backoff)
                time.sleep(delay)
                
                url = f"{MUSICBRAINZ_API_URL}artist/{mbid}"
                response = self.session.get(url, timeout=15)
                self.request_count += 1
                
                if response.status_code == 200:
                    # Succès : reset du backoff
                    self.current_backoff = self.mb_delay
                    data = response.json()
                    
                    # Sauvegarder dans le cache
                    if self.cache:
                        self.cache.set(mbid, data)
                        # Sauvegarde périodique tous les 50 entrées
                        if len(self.cache.cache) % 50 == 0:
                            self.cache.save()
                    
                    return data
                
                elif response.status_code == 404:
                    # Artiste non trouvé : pas de retry
                    self.current_backoff = self.mb_delay
                    return None
                
                elif response.status_code == 503:
                    # 🎯 Rate limit : backoff exponentiel
                    self.rate_limited_count += 1
                    self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
                    
                    wait_time = int(self.current_backoff)
                    print(f"\n⚠️  Rate limit MusicBrainz (503) - "
                          f"Tentative {attempt + 1}/{max_attempts} - "
                          f"Attente de {wait_time}s (backoff)")
                    
                    # Si c'est la dernière tentative, on abandonne
                    if attempt == max_attempts - 1:
                        print(f"❌ Abandon après {max_attempts} tentatives pour MBID {mbid[:8]}...")
                        return None
                
                elif response.status_code == 429:
                    # Rate limit explicite
                    self.rate_limited_count += 1
                    retry_after = int(response.headers.get('Retry-After', 60))
                    print(f"\n⚠️  Rate limit MusicBrainz (429) - Retry-After: {retry_after}s")
                    time.sleep(retry_after)
                
                else:
                    print(f"\n⚠️  MusicBrainz HTTP {response.status_code}")
                    return None
                    
            except requests.RequestException as e:
                print(f"\n⚠️  Erreur réseau MusicBrainz: {e}")
                time.sleep(2)
        
        return None
    
    def extract_country_and_formed(self, mbid: str) -> Tuple[Optional[str], Optional[int]]:
        """Extrait pays et année de formation depuis MusicBrainz."""
        artist_data = self.get_artist(mbid)
        if not artist_data:
            return None, None
        
        # Extraction du pays
        country = artist_data.get('country')
        if country:
            country = iso_to_country_name(country)
        
        # Extraction de l'année de formation
        formed = None
        life_span = artist_data.get('life_span', {})
        begin_date = life_span.get('begin', '')
        
        if begin_date:
            try:
                year_str = begin_date[:4]
                year = int(year_str)
                if 1960 <= year <= datetime.now().year:
                    formed = year
            except (ValueError, TypeError):
                pass
        
        return country, formed
    
    def save_cache(self):
        """Sauvegarde le cache sur le disque."""
        if self.cache:
            self.cache.save()
            print(f"💾 Cache MBID sauvegardé : {len(self.cache.cache)} entrées")

# ═══════════════════════════════════════════════════════════
# CONVERSION ISO → NOM DE PAYS
# ═══════════════════════════════════════════════════════════

ISO_TO_COUNTRY = {
    'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AR': 'Argentina',
    'AM': 'Armenia', 'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan',
    'BD': 'Bangladesh', 'BY': 'Belarus', 'BE': 'Belgium', 'BR': 'Brazil',
    'BG': 'Bulgaria', 'CA': 'Canada', 'CL': 'Chile', 'CN': 'China',
    'CO': 'Colombia', 'HR': 'Croatia', 'CU': 'Cuba', 'CZ': 'Czechia',
    'DK': 'Denmark', 'EG': 'Egypt', 'EE': 'Estonia', 'FI': 'Finland',
    'FR': 'France', 'GE': 'Georgia', 'DE': 'Germany', 'GR': 'Greece',
    'HU': 'Hungary', 'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia',
    'IR': 'Iran', 'IQ': 'Iraq', 'IE': 'Ireland', 'IL': 'Israel',
    'IT': 'Italy', 'JP': 'Japan', 'KZ': 'Kazakhstan', 'KE': 'Kenya',
    'KR': 'South Korea', 'LV': 'Latvia', 'LT': 'Lithuania', 'LU': 'Luxembourg',
    'MK': 'North Macedonia', 'MY': 'Malaysia', 'MX': 'Mexico', 'MA': 'Morocco',
    'NL': 'Netherlands', 'NZ': 'New Zealand', 'NG': 'Nigeria', 'NO': 'Norway',
    'PK': 'Pakistan', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland',
    'PT': 'Portugal', 'RO': 'Romania', 'RU': 'Russia', 'SA': 'Saudi Arabia',
    'RS': 'Serbia', 'SG': 'Singapore', 'SK': 'Slovakia', 'SI': 'Slovenia',
    'ZA': 'South Africa', 'ES': 'Spain', 'SE': 'Sweden', 'CH': 'Switzerland',
    'TW': 'Taiwan', 'TH': 'Thailand', 'TR': 'Turkey', 'UA': 'Ukraine',
    'AE': 'United Arab Emirates', 'GB': 'United Kingdom', 'US': 'United States',
    'UY': 'Uruguay', 'VE': 'Venezuela', 'VN': 'Vietnam',
}

def iso_to_country_name(iso_code: str) -> str:
    if not iso_code:
        return 'Unknown'
    return ISO_TO_COUNTRY.get(iso_code.upper(), iso_code)

# ═══════════════════════════════════════════════════════════
# TRAITEMENT DES DONNÉES
# ═══════════════════════════════════════════════════════════

def extract_genre_from_tags(tags: List[Dict]) -> str:
    for tag in tags:
        tag_name = tag.get('name', '').lower()
        if tag_name in METAL_GENRES:
            return tag_name.title()
    return 'Metal'

def clean_biography(bio_content: str) -> str:
    if not bio_content:
        return ''
    clean = re.sub(r'<[^>]+>', '', bio_content)
    clean = re.sub(r'\s*(?:Read more|Lire la suite|Mehr lesen|Más información|Leggi tutto).*$', 
                   '', clean, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'https?://www\.last\.fm[^\s]*', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean[:2000]

def process_artist(
    artist_data: Dict, 
    source_tag: str, 
    bio_lang: str,
    musicbrainz_client: Optional[MusicBrainzClient] = None,
) -> Optional[Dict]:
    if not artist_data:
        return None
    
    name = artist_data.get('name', '').strip()
    if not name:
        return None
    
    tags = artist_data.get('tags', {}).get('tag', [])
    if not isinstance(tags, list):
        tags = []
    
    genre = extract_genre_from_tags(tags)
    bio_content = artist_data.get('bio', {}).get('content', '')
    biography = clean_biography(bio_content)
    
    images = artist_data.get('image', [])
    image_url = None
    if images:
        for img in reversed(images):
            if img.get('#text'):
                image_url = img['#text']
                break
    
    try:
        listeners = int(artist_data.get('stats', {}).get('listeners', 0) or 0)
    except (ValueError, TypeError):
        listeners = 0
    
    # ═══════════════════════════════════════════════════════
    # PAYS : MusicBrainz → Tags Last.fm → Unknown
    # ═══════════════════════════════════════════════════════
    country = None
    country_source = None
    formed = None
    formed_source = None
    
    mbid = artist_data.get('mbid', '').strip()
    
    if musicbrainz_client and mbid:
        mb_country, mb_formed = musicbrainz_client.extract_country_and_formed(mbid)
        if mb_country:
            country = mb_country
            country_source = 'musicbrainz'
        if mb_formed:
            formed = mb_formed
            formed_source = 'musicbrainz'
    
    if not country:
        tag_country = extract_country_from_tags(tags)
        if tag_country:
            country = tag_country
            country_source = 'lastfm_tags'
    
    if not country:
        country = 'Unknown'
        country_source = 'unknown'
    
    if not formed_source:
        formed_source = 'unknown'
    
    now_utc = datetime.now(timezone.utc).isoformat()
    
    return {
        'name': name,
        'genre': genre,
        'country': country,
        'country_source': country_source,
        'formed': formed,
        'formed_source': formed_source,
        'mbid': mbid or None,
        'status': 'Active',
        'biography': biography or None,
        'bio_lang': bio_lang,
        'image_url': image_url,
        'listeners': listeners,
        'source_tag': source_tag,
        'fetched_at': now_utc,
    }

# ═══════════════════════════════════════════════════════════
# GESTION DU PROGRESS
# ═══════════════════════════════════════════════════════════

def load_progress(progress_path: str) -> Dict:
    path = Path(progress_path)
    if not path.exists():
        return {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 0}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 0}

def save_progress(progress_path: str, progress: Dict):
    path = Path(progress_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False)

def reset_progress(progress_path: str):
    path = Path(progress_path)
    if path.exists():
        path.unlink()
        print(f"🗑️  Progression réinitialisée")

# ═══════════════════════════════════════════════════════════
# SCRIPT PRINCIPAL
# ═══════════════════════════════════════════════════════════

def fetch_all_metal_bands(
    limit: int = DEFAULT_LIMIT,
    resume: bool = False,
    progress_path: str = PROGRESS_FILE,
    preferred_lang: str = DEFAULT_LANG,
    use_musicbrainz: bool = True,
    mb_delay: float = DEFAULT_MB_DELAY,
) -> Tuple[List[Dict], Dict, Dict]:
    
    if not LASTFM_API_KEY:
        print("❌ Erreur: LASTFM_API_KEY non définie dans .env")
        return [], {}, {}
    
    lastfm_client = LastFmClient(LASTFM_API_KEY, default_lang=preferred_lang)
    musicbrainz_client = MusicBrainzClient(mb_delay=mb_delay, use_cache=use_musicbrainz) if use_musicbrainz else None
    
    if resume:
        progress = load_progress(progress_path)
        seen_names: Set[str] = set(progress.get('seen_names', []))
        bands_list: List[Dict] = progress.get('bands', [])
        start_tag_idx = progress.get('last_tag_index', 0)
        start_page = progress.get('last_page', 0)
        print(f"\n🔄 Reprise depuis le tag {start_tag_idx}, page {start_page}")
        print(f"   ✅ {len(bands_list)} groupes déjà récupérés")
    else:
        progress = {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 0}
        seen_names = set()
        bands_list = []
        start_tag_idx = 0
        start_page = 0
    
    print(f"\n🎸 Démarrage de la récupération de {limit} groupes metal...")
    print(f"📊 {len(METAL_TAGS)} sous-genres à explorer")
    print(f"🌍 Langue préférée : {preferred_lang.upper()} (avec fallback sur anglais)")
    if use_musicbrainz:
        print(f"🎵 MusicBrainz : ACTIVÉ (délai: {mb_delay}s)")
    else:
        print(f"🎵 MusicBrainz : DÉSACTIVÉ")
    print(f"🔑 Clé Last.fm: {LASTFM_API_KEY[:8]}...")
    print()
    
    for tag_idx, tag in enumerate(tqdm(METAL_TAGS[start_tag_idx:], desc="Genres", initial=start_tag_idx)):
        actual_tag_idx = start_tag_idx + tag_idx
        page = start_page if tag_idx == 0 else 1
        max_pages = 5
        
        while page <= max_pages and len(bands_list) < limit:
            artists = lastfm_client.get_top_artists_by_tag(tag, limit=100, page=page)
            
            if not artists:
                break
            
            for artist in artists:
                if len(bands_list) >= limit:
                    break
                
                artist_name = artist.get('name', '').strip()
                if not artist_name or artist_name in seen_names:
                    continue
                
                seen_names.add(artist_name)
                
                artist_info, actual_lang = lastfm_client.get_artist_info_with_fallback(
                    artist_name,
                    preferred_lang=preferred_lang,
                    fallback_lang='en'
                )
                
                if artist_info:
                    if actual_lang == preferred_lang:
                        lastfm_client.stats[f'bio_{preferred_lang}'] += 1
                    elif actual_lang == 'en':
                        lastfm_client.stats['bio_en'] += 1
                    else:
                        lastfm_client.stats['bio_none'] += 1
                    
                    processed = process_artist(
                        artist_info, 
                        tag, 
                        actual_lang,
                        musicbrainz_client=musicbrainz_client
                    )
                    if processed:
                        bands_list.append(processed)
            
            progress['seen_names'] = list(seen_names)
            progress['bands'] = bands_list
            progress['last_tag_index'] = actual_tag_idx
            progress['last_page'] = page
            save_progress(progress_path, progress)
            
            page += 1
        
        start_page = 0
    
    # Sauvegarde finale du cache MBID
    if musicbrainz_client:
        musicbrainz_client.save_cache()
    
    print(f"\n✅ Récupération terminée !")
    print(f"📊 {len(bands_list)} groupes uniques récupérés")
    print(f"🌐 Last.fm     : {lastfm_client.request_count} requêtes")
    if use_musicbrainz:
        cache_stats = musicbrainz_client.cache.stats() if musicbrainz_client.cache else {}
        print(f"🎵 MusicBrainz : {musicbrainz_client.request_count} requêtes API")
        print(f"💾 Cache MBID  : {cache_stats.get('hits', 0)} hits / {cache_stats.get('misses', 0)} misses")
        print(f"⚠️  Rate limits : {musicbrainz_client.rate_limited_count} occurrences")
    
    return bands_list, lastfm_client.stats, musicbrainz_client.stats if musicbrainz_client else {}

def save_to_json(bands: List[Dict], output_path: str, lastfm_stats: Dict, mb_stats: Dict, lang: str):
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    now_utc = datetime.now(timezone.utc).isoformat()
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'total_bands': len(bands),
                'fetched_at': now_utc,
                'source': 'Last.fm + MusicBrainz',
                'preferred_lang': lang,
                'lastfm_stats': lastfm_stats,
                'musicbrainz_stats': mb_stats,
            },
            'bands': bands,
        }, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Données sauvegardées dans {output_path}")
    print(f"📦 Taille du fichier: {path.stat().st_size / 1024:.1f} KB")

def print_stats(lastfm_stats: Dict, mb_stats: Dict):
    print("\n" + "=" * 60)
    print("📊 STATISTIQUES DE RÉCUPÉRATION")
    print("=" * 60)
    
    if lastfm_stats:
        total_bio = sum(lastfm_stats.values())
        if total_bio > 0:
            print(f"\n🌍 Langues des biographies (Last.fm) :")
            for lang, count in sorted(lastfm_stats.items(), key=lambda x: x[1], reverse=True):
                pct = (count * 100) // total_bio
                label = {'bio_fr': '🇫🇷 Français', 'bio_en': '🇬🇧 Anglais', 'bio_none': '❌ Aucune'}.get(lang, lang)
                print(f"   {label:25s} {count:5,} ({pct:2d}%)")
    
    if mb_stats:
        total_mb = sum(mb_stats.values())
        if total_mb > 0:
            print(f"\n🎵 Résultats MusicBrainz :")
            for key, count in sorted(mb_stats.items(), key=lambda x: x[1], reverse=True):
                pct = (count * 100) // total_mb
                label = {
                    'found': '✅ Trouvés',
                    'not_found': '❌ Non trouvés',
                    'errors': '⚠️  Erreurs',
                    'no_mbid': '🔍 Sans MBID',
                }.get(key, key)
                print(f"   {label:25s} {count:5,} ({pct:2d}%)")
    
    print("=" * 60)

# ═══════════════════════════════════════════════════════════
# CLI PRINCIPAL
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Récupère des groupes metal via Last.fm + MusicBrainz (optimisé anti-rate-limit)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  python fetch_metal_bands.py                        # 10 000 groupes (délai 2s)
  python fetch_metal_bands.py --limit 500            # 500 groupes
  python fetch_metal_bands.py --mb-delay 3           # Délai MusicBrainz 3s
  python fetch_metal_bands.py --mb-delay 5           # Délai MusicBrainz 5s (ultra-safe)
  python fetch_metal_bands.py --skip-musicbrainz     # Sans MusicBrainz
  python fetch_metal_bands.py --resume               # Reprendre
        """
    )
    
    parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT)
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT)
    parser.add_argument('--lang', type=str, default=DEFAULT_LANG)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--reset', action='store_true')
    parser.add_argument('--skip-musicbrainz', action='store_true')
    parser.add_argument('--mb-delay', type=float, default=DEFAULT_MB_DELAY,
                        help=f'Délai entre requêtes MusicBrainz en secondes (défaut: {DEFAULT_MB_DELAY}s)')
    parser.add_argument('--clear-mb-cache', action='store_true',
                        help='Vider le cache MBID avant de commencer')
    
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("🎸 METALPEDIA - Récupération Last.fm + MusicBrainz")
    print("   (Version optimisée anti-rate-limit)")
    print("=" * 60)
    
    if args.reset:
        reset_progress(PROGRESS_FILE)
        return
    
    if args.clear_mb_cache:
        cache_path = Path(MB_CACHE_FILE)
        if cache_path.exists():
            cache_path.unlink()
            print(f"🗑️  Cache MBID vidé")
    
    valid_langs = {'fr', 'en', 'de', 'es', 'it', 'pl', 'pt', 'ru', 'sv', 'ja', 'zh'}
    if args.lang not in valid_langs:
        print(f"⚠️  Langue '{args.lang}' non standard. Utilisation de 'fr'.")
        args.lang = 'fr'
    
    start_time = time.time()
    bands, lastfm_stats, mb_stats = fetch_all_metal_bands(
        args.limit, 
        args.resume,
        preferred_lang=args.lang,
        use_musicbrainz=not args.skip_musicbrainz,
        mb_delay=args.mb_delay,
    )
    
    if bands:
        save_to_json(bands, args.output, lastfm_stats, mb_stats, args.lang)
        print_stats(lastfm_stats, mb_stats)
    
    elapsed = time.time() - start_time
    print(f"\n⏱️  Temps total: {elapsed/60:.1f} minutes")

if __name__ == '__main__':
    main()
