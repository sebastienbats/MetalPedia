#!/usr/bin/env python3
"""
Récupère des groupes metal via Last.fm + MusicBrainz.

Sources de données :
  - Last.fm : nom, bio, images, popularité, tags, MBID
  - MusicBrainz : pays, année de formation (via le MBID)
  - Tags Last.fm : fallback pour le pays si MusicBrainz échoue

Usage:
  python fetch_metal_bands.py                        # 10 000 groupes
  python fetch_metal_bands.py --limit 500            # 500 groupes
  python fetch_metal_bands.py --lang en              # Bios en anglais
  python fetch_metal_bands.py --resume               # Reprendre après interruption
  python fetch_metal_bands.py --skip-musicbrainz     # Désactiver MusicBrainz (plus rapide)
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

# Rate limiting
LASTFM_DELAY = 0.25          # 4 req/sec pour Last.fm
MUSICBRAINZ_DELAY = 1.1      # ~1 req/sec pour MusicBrainz (recommandé officiellement)

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

# Mapping tag → pays (pour extraction depuis les tags Last.fm)
TAG_TO_COUNTRY = {
    # Pays complets
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
    
    # Régions metal célèbres
    'scandinavian': 'Sweden',  # Fallback par défaut pour la Scandinavie
    'baltic': 'Latvia',
}

def extract_country_from_tags(tags: List[Dict]) -> Optional[str]:
    """
    Tente d'extraire le pays depuis les tags Last.fm.
    Cherche des patterns comme "swedish death metal", "norwegian black metal", etc.
    """
    for tag in tags:
        tag_name = tag.get('name', '').lower()
        
        # Cherche un mot-clé de pays dans le tag
        for keyword, country in TAG_TO_COUNTRY.items():
            if keyword in tag_name:
                return country
    
    return None

# ═══════════════════════════════════════════════════════════
# CLIENT LAST.FM
# ═══════════════════════════════════════════════════════════

class LastFmClient:
    """Client HTTP pour l'API Last.fm avec rate limiting et retry."""
    
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
                    print(f"\n❌ Clé API Last.fm invalide ou quota dépassé")
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
        """Récupère les infos avec fallback linguistique."""
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
# CLIENT MUSICBRAINZ
# ═══════════════════════════════════════════════════════════

class MusicBrainzClient:
    """
    Client pour l'API MusicBrainz (gratuite, sans clé API).
    Récupère le pays et l'année de formation via le MBID.
    
    Rate limit officiel : 1 requête/seconde avec User-Agent approprié.
    Documentation : https://musicbrainz.org/doc/MusicBrainz_API
    """
    
    def __init__(self):
        self.session = requests.Session()
        # User-Agent obligatoire selon les règles de MusicBrainz
        self.session.headers.update({
            'User-Agent': 'MetalPedia/1.0 (https://metalpedia.vercel.app; contact@metalpedia.com)',
            'Accept': 'application/json',
        })
        self.request_count = 0
        self.stats = {
            'found': 0,
            'not_found': 0,
            'errors': 0,
            'no_mbid': 0,
        }
    
    def get_artist(self, mbid: str) -> Optional[Dict]:
        """
        Récupère les infos d'un artiste via son MBID.
        
        Returns:
            Dict avec 'country' et 'life_span.begin' (année de formation)
            ou None en cas d'échec.
        """
        if not mbid:
            self.stats['no_mbid'] += 1
            return None
        
        try:
            time.sleep(MUSICBRAINZ_DELAY)  # Respect du rate limit
            url = f"{MUSICBRAINZ_API_URL}artist/{mbid}"
            response = self.session.get(url, timeout=10)
            self.request_count += 1
            
            if response.status_code == 200:
                self.stats['found'] += 1
                return response.json()
            elif response.status_code == 404:
                self.stats['not_found'] += 1
                return None
            elif response.status_code == 503:
                # Rate limit MusicBrainz
                print(f"\n⚠️  Rate limit MusicBrainz, attente de 60s...")
                time.sleep(60)
                return None
            else:
                self.stats['errors'] += 1
                return None
                
        except requests.RequestException as e:
            print(f"\n⚠️  Erreur réseau MusicBrainz: {e}")
            self.stats['errors'] += 1
            return None
    
    def extract_country_and_formed(self, mbid: str) -> Tuple[Optional[str], Optional[int]]:
        """
        Extrait le pays et l'année de formation depuis MusicBrainz.
        
        Returns:
            Tuple (country, formed_year)
        """
        artist_data = self.get_artist(mbid)
        if not artist_data:
            return None, None
        
        # Extraction du pays
        country = artist_data.get('country')  # Code ISO 2 lettres (ex: 'SE', 'US')
        if country:
            country = iso_to_country_name(country)
        
        # Extraction de l'année de formation
        formed = None
        life_span = artist_data.get('life_span', {})
        begin_date = life_span.get('begin', '')  # Format: '1981-04-23' ou '1981'
        
        if begin_date:
            try:
                # Prend seulement l'année (4 premiers caractères)
                year_str = begin_date[:4]
                year = int(year_str)
                # Validation : année raisonnable pour un groupe de metal
                if 1960 <= year <= datetime.now().year:
                    formed = year
            except (ValueError, TypeError):
                pass
        
        return country, formed

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
    """Convertit un code ISO 2 lettres en nom de pays."""
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
    """
    Transforme les données Last.fm + MusicBrainz en format JSON.
    
    Stratégie pour le pays :
      1. MusicBrainz (via MBID) - source la plus fiable
      2. Tags Last.fm (fallback) - ex: "swedish death metal" → Sweden
      3. 'Unknown' si aucune source ne fonctionne
    """
    if not artist_data:
        return None
    
    name = artist_data.get('name', '').strip()
    if not name:
        return None
    
    # Tags/genres
    tags = artist_data.get('tags', {}).get('tag', [])
    if not isinstance(tags, list):
        tags = []
    
    genre = extract_genre_from_tags(tags)
    
    # Biographie
    bio_content = artist_data.get('bio', {}).get('content', '')
    biography = clean_biography(bio_content)
    
    # Image
    images = artist_data.get('image', [])
    image_url = None
    if images:
        for img in reversed(images):
            if img.get('#text'):
                image_url = img['#text']
                break
    
    # Listeners
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
    
    # 1. Tentative via MusicBrainz (si activé et MBID disponible)
    if musicbrainz_client and mbid:
        mb_country, mb_formed = musicbrainz_client.extract_country_and_formed(mbid)
        if mb_country:
            country = mb_country
            country_source = 'musicbrainz'
        if mb_formed:
            formed = mb_formed
            formed_source = 'musicbrainz'
    
    # 2. Fallback pour le pays : extraction depuis les tags Last.fm
    if not country:
        tag_country = extract_country_from_tags(tags)
        if tag_country:
            country = tag_country
            country_source = 'lastfm_tags'
    
    # 3. Dernier recours
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
        'country_source': country_source,  # 🆕 Traçabilité
        'formed': formed,
        'formed_source': formed_source,    # 🆕 Traçabilité
        'mbid': mbid or None,              # 🆕 MBID pour référence
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
) -> Tuple[List[Dict], Dict, Dict]:
    
    if not LASTFM_API_KEY:
        print("❌ Erreur: LASTFM_API_KEY non définie dans .env")
        return [], {}, {}
    
    lastfm_client = LastFmClient(LASTFM_API_KEY, default_lang=preferred_lang)
    musicbrainz_client = MusicBrainzClient() if use_musicbrainz else None
    
    # Chargement de la progression
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
        print(f"🎵 MusicBrainz : ACTIVÉ (pays + année de formation)")
    else:
        print(f"🎵 MusicBrainz : DÉSACTIVÉ (pays via tags uniquement)")
    print(f"🔑 Clé Last.fm: {LASTFM_API_KEY[:8]}...")
    print()
    
    # Parcours de chaque tag
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
                
                # Last.fm avec fallback linguistique
                artist_info, actual_lang = lastfm_client.get_artist_info_with_fallback(
                    artist_name,
                    preferred_lang=preferred_lang,
                    fallback_lang='en'
                )
                
                if artist_info:
                    # Stats linguistiques
                    if actual_lang == preferred_lang:
                        lastfm_client.stats[f'bio_{preferred_lang}'] += 1
                    elif actual_lang == 'en':
                        lastfm_client.stats['bio_en'] += 1
                    else:
                        lastfm_client.stats['bio_none'] += 1
                    
                    # Traitement avec MusicBrainz
                    processed = process_artist(
                        artist_info, 
                        tag, 
                        actual_lang,
                        musicbrainz_client=musicbrainz_client
                    )
                    if processed:
                        bands_list.append(processed)
            
            # Sauvegarde de la progression
            progress['seen_names'] = list(seen_names)
            progress['bands'] = bands_list
            progress['last_tag_index'] = actual_tag_idx
            progress['last_page'] = page
            save_progress(progress_path, progress)
            
            page += 1
        
        start_page = 0
    
    print(f"\n✅ Récupération terminée !")
    print(f"📊 {len(bands_list)} groupes uniques récupérés")
    print(f"🌐 Last.fm     : {lastfm_client.request_count} requêtes")
    if use_musicbrainz:
        print(f"🎵 MusicBrainz : {musicbrainz_client.request_count} requêtes")
    
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
    """Affiche un résumé des statistiques."""
    print("\n" + "=" * 60)
    print("📊 STATISTIQUES DE RÉCUPÉRATION")
    print("=" * 60)
    
    # Stats linguistiques Last.fm
    if lastfm_stats:
        total_bio = sum(lastfm_stats.values())
        if total_bio > 0:
            print(f"\n🌍 Langues des biographies (Last.fm) :")
            for lang, count in sorted(lastfm_stats.items(), key=lambda x: x[1], reverse=True):
                pct = (count * 100) // total_bio
                label = {'bio_fr': '🇫🇷 Français', 'bio_en': '🇬🇧 Anglais', 'bio_none': '❌ Aucune'}.get(lang, lang)
                print(f"   {label:25s} {count:5,} ({pct:2d}%)")
    
    # Stats MusicBrainz
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
        description='Récupère des groupes metal via Last.fm + MusicBrainz',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    
    parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT)
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT)
    parser.add_argument('--lang', type=str, default=DEFAULT_LANG)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--reset', action='store_true')
    parser.add_argument('--skip-musicbrainz', action='store_true',
                        help='Désactiver MusicBrainz (plus rapide, mais pas de pays/année)')
    
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("🎸 METALPEDIA - Récupération Last.fm + MusicBrainz")
    print("=" * 60)
    
    if args.reset:
        reset_progress(PROGRESS_FILE)
        return
    
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
    )
    
    if bands:
        save_to_json(bands, args.output, lastfm_stats, mb_stats, args.lang)
        print_stats(lastfm_stats, mb_stats)
    
    elapsed = time.time() - start_time
    print(f"\n⏱️  Temps total: {elapsed/60:.1f} minutes")

if __name__ == '__main__':
    main()
