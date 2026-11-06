#!/usr/bin/env python3
"""
Récupère des groupes metal via Last.fm + MusicBrainz + Discogs + Cover Art Archive.
Fonctionnalités :
- Récupération des groupes par sous-genre metal (Last.fm tag.getTopArtists)
- ✨ FILTRAGE PAR PILIER : --pillar "Folk Metal" pour cibler un pilier spécifique
- Biographies multi-langues (FR → EN fallback)
- Albums via Last.fm artist.getTopAlbums
- ✨ FILTRAGE MBID STRICT : Seuls les albums avec un MBID valide (36 chars) sont conservés
- ✨ OPTIMISATION RAPIDE (Solution A) : Limite albums bruts traités + suppression fallback album.getInfo
- ✨ Enrichissement Discogs priorisé par MBID (via MusicBrainz url-rels)
- ✨ Recherche Discogs ciblée par artiste (fallback via 'q')
- ✨ Filtrage côté client pour ne garder que les masters de l'artiste
- ✨ Extraction du titre d'album depuis le format "Artist - Album"
- ✨ Recherche MusicBrainz ciblée par type (release-group type:album)
- ✨ OPTIMISATION : MBID cherchés uniquement pour les albums filtrés (master/album)
- ✨ ANTI-BACKOFF : Délai augmenté, nettoyage des requêtes, réinitialisation après succès, negative caching
- ✨ FILTRAGE DES GENRES ARTISTES : Liste blanche de 35 genres metal officiels
- ✨ CHAÎNE DE RÉSOLUTION D'IMAGES : Last.fm → Discogs → MusicBrainz/Wikimedia
- ✨ MODE --force : Force la récupération même si les données existent déjà
- ✨ RÉCUPÉRATION DISCOGS_ID, DISCOGS_URI et MEMBRES pour les artistes
- ✨ ENRICHISSEMENT OPTIMISÉ DES ANNÉES D'ALBUMS via MusicBrainz (MBID) puis Discogs (URI)
- ✨ Mode --focus-albums : récupération ultra-rapide des métadonnées d'albums
- ✨ Mode --include-tracks : récupère la tracklist de chaque album via Discogs
- ✨ Cache des tracklists : évite les requêtes répétées vers /masters/{id}
- ✨ DÉDUPLICATION ROBUSTE : Supprime les albums en double basés sur l'URI Discogs
- ✨ TYPE ALBUM PAR DÉFAUT : Tous les albums Last.fm sont marqués 'album' par défaut
- ✨ FILTRAGE AMÉLIORÉ : Accepte plusieurs types (ex: "master,album")
- ✨ Normalisation améliorée des titres d'albums
- ✨ Champ uri rempli automatiquement (Last.fm URL ou Discogs URI)
- ✨ Membres via MusicBrainz (priorité) + Discogs (complément)
- ✨ Images artistes via chaîne de résolution (Last.fm → Discogs → MB/Wikimedia)
- ✨ BARRE DE PROGRESSION GLOBALE basée sur le nombre de groupes cibles
- ✨ LOGS DÉTAILLÉS toutes les 50 bands avec ETA et stats albums
- ✨ RAPPORT FINAL consolidé (durée, taux MBID, rejets)
- ✨ GESTION CTRL+C propre avec message de reprise
- ✨ OPTION --max-albums : Limite strictement le nombre d'albums récupérés par artiste
- ✨ MAPPING GENRE → PILIER : grindcore/goregrind/pornogrind/noisecore → Death Metal
- ✨ MAPPING GENRE → PILIER : mathcore → Metalcore
- ✨ MAPPING GENRE → PILIER : glam metal → Heavy Metal
- Covers albums via Last.fm / Discogs → Cover Art Archive (fallback)
- ✨ Résolution du pays via hiérarchie des zones MusicBrainz (ville → pays)
- ✨ Support de --min-listeners dans toutes les configurations
- ✨ Cache agressif : sauvegarde automatique toutes les 10 entrées
- Format de sortie : {"bands": [...]}
Usage:
python fetch_metal_bands.py --limit 500 --with-discogs --min-listeners 5000 --max-albums 50
python fetch_metal_bands.py --pillar "Folk Metal" --limit 100 --with-discogs --max-albums 30
python fetch_metal_bands.py --pillar "Thrash Metal" --limit 200 --with-discogs --min-listeners 10000 --max-albums 25
python fetch_metal_bands.py --pillar "Death Metal" --limit 500 --with-discogs --min-listeners 10000 --max-albums 25
python fetch_metal_bands.py --update-from ../data/metal_bands_latest.json --pillar "Folk Metal" --update-fields members
python fetch_metal_bands.py --focus-albums --include-tracks --limit 100 --with-discogs --max-albums 30
python fetch_metal_bands.py --update-from ../data/metal_bands_latest.json --update-fields albums
python fetch_metal_bands.py --update-from ../data/metal_bands_latest.json --update-fields members --with-discogs
python fetch_metal_bands.py --update-from ../data/metal_bands_latest.json --update-fields image_url --with-discogs --force
python fetch_metal_bands.py --enrich-years --update-from ../data/metal_bands_updated_latest.json --with-discogs
python fetch_metal_bands.py --test
python fetch_metal_bands.py --clear-tracklist-cache
"""
import os
import sys
import json
import time
import re
import random
import argparse
import logging
import socket
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, List, Set, Tuple, Union
from urllib.parse import unquote, urlparse
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / '.env')

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════
LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')
DISCOGS_TOKEN = os.getenv('DISCOGS_TOKEN')
LASTFM_API_URL_HTTP = 'http://ws.audioscrobbler.com/2.0/'
LASTFM_API_URL_HTTPS = 'https://ws.audioscrobbler.com/2.0/'
MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2/'
DISCOGS_API_URL = 'https://api.discogs.com/'
COVERART_ARCHIVE_URL = 'https://coverartarchive.org'
CAA_THUMB_SIZE = '500'
CAA_DELAY = 0.3
DEFAULT_OUTPUT = '../data/metal_bands.json'
DEFAULT_LIMIT = 10000
DEFAULT_LANG = 'fr'
DEFAULT_MAX_ALBUMS = 100  # ✨ Limite par défaut d'albums par artiste
RAW_ALBUMS_MULTIPLIER = 2  # ✨ Solution A : on traite max_albums * 2 albums bruts max
MIN_BIO_LENGTH = 100
MAX_BIO_LENGTH = None
LASTFM_DELAY = 0.25
DEFAULT_MB_DELAY = 1.2
DISCOGS_DELAY = 1.1
CACHE_SAVE_INTERVAL = 10
PROGRESS_LOG_INTERVAL = 50  # ✨ Log détaillé toutes les N bands
PLACEHOLDER_HASHES = ('2a96cbd8b46e442fc41c2b86b821562f', 'c6f59c1e5e7240a4c0d427abd71f3dbb')
LASTFM_SIZE_ORDER = ('mega', 'extralarge', 'large', 'medium', 'small')
MB_MIN_SCORE = 50
MB_CACHE_FILE = '../data/mbid_cache.json'
DISCOGS_CACHE_FILE = '../data/discogs_cache.json'
LASTFM_CACHE_FILE = '../data/lastfm_cache.json'
CAA_CACHE_FILE = '../data/coverart_cache.json'
TRACKLIST_CACHE_FILE = '../data/tracklist_cache.json'
PROGRESS_FILE = '../data/fetch_progress.json'
LOG_FILE = '../logs/metal_fetcher.log'

# ═══════════════════════════════════════════════════════════
# ✨ LISTE BLANCHE DES GENRES METAL (MUSICBRAINZ)
# ═══════════════════════════════════════════════════════════
ALLOWED_METAL_GENRES = {
    "melodic black metal", "melodic death metal", "melodic metalcore",
    "medieval metal", "mathcore", "alternative metal", "avant-garde metal",
    "black metal", "christian metal", "death metal", "doom metal",
    "drone metal", "folk metal", "gothic metal", "groove metal",
    "heavy metal", "kawaii metal", "neoclassical metal", "post-metal",
    "power metal", "progressive metal", "sludge metal", "southern metal",
    "stoner metal", "symphonic metal", "thrash metal", "viking metal",
    "grindcore", "industrial metal", "metalcore",
    # ✨ NOUVEAUX GENRES AJOUTÉS
    "goregrind", "pornogrind", "noisecore", "glam metal", "pagan metal"
}

# ═══════════════════════════════════════════════════════════
# ✨ 9 PILIERS PRINCIPAUX DU METAL
# ═══════════════════════════════════════════════════════════
METAL_PILLARS = {
    'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal',
    'Power Metal', 'Doom Metal', 'Progressive Metal', 'Folk Metal', 'Metalcore',
}

# ═══════════════════════════════════════════════════════════
# ✨ MAPPING GENRE → PILIER (CORRIGÉ ET COMPLÉTÉ)
# ═══════════════════════════════════════════════════════════
GENRE_TO_PILLAR = {
    # Folk Metal
    'folk metal': 'Folk Metal', 'viking metal': 'Folk Metal', 'pagan metal': 'Folk Metal',
    # Black Metal
    'black metal': 'Black Metal', 'norwegian black metal': 'Black Metal',
    'symphonic black metal': 'Black Metal', 'melodic black metal': 'Black Metal',
    'folk black metal': 'Black Metal', 'viking black metal': 'Black Metal',
    # Death Metal (inclut grindcore et sous-genres extrêmes)
    'death metal': 'Death Metal', 'melodic death metal': 'Death Metal',
    'brutal death metal': 'Death Metal', 'technical death metal': 'Death Metal',
    'swedish death metal': 'Death Metal', 'finnish death metal': 'Death Metal',
    'grindcore': 'Death Metal', 'goregrind': 'Death Metal',
    'pornogrind': 'Death Metal', 'noisecore': 'Death Metal',
    # Thrash Metal
    'thrash metal': 'Thrash Metal', 'thrash': 'Thrash Metal',
    'speed metal': 'Thrash Metal', 'crossover thrash': 'Thrash Metal',
    'teutonic thrash': 'Thrash Metal', 'groove metal': 'Thrash Metal',
    # Power Metal
    'power metal': 'Power Metal', 'epic metal': 'Power Metal', 'symphonic metal': 'Power Metal',
    # Doom Metal
    'doom metal': 'Doom Metal', 'sludge metal': 'Doom Metal',
    'stoner metal': 'Doom Metal', 'gothic metal': 'Doom Metal',
    # Progressive Metal
    'progressive metal': 'Progressive Metal', 'post-metal': 'Progressive Metal',
    'djent': 'Progressive Metal',
    # Metalcore (mathcore déplacé ici depuis Progressive Metal)
    'metalcore': 'Metalcore', 'melodic metalcore': 'Metalcore',
    'metallic hardcore': 'Metalcore', 'deathcore': 'Metalcore',
    'nu metal': 'Metalcore', 'mathcore': 'Metalcore',
    # Heavy Metal (défaut)
    'heavy metal': 'Heavy Metal', 'true metal': 'Heavy Metal',
    'metal': 'Heavy Metal', 'glam metal': 'Heavy Metal',
}

def resolve_pillar(genre: Optional[str]) -> str:
    """Résout un genre (ou un pilier déjà normalisé) vers l'un des 9 piliers."""
    if not genre:
        return 'Heavy Metal'
    return GENRE_TO_PILLAR.get(genre.strip().lower(), 'Heavy Metal')

# ═══════════════════════════════════════════════════════════
# LOGGING SETUP
# ═══════════════════════════════════════════════════════════
def setup_logging(log_level: str = 'INFO', log_file: Optional[str] = LOG_FILE):
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    handlers = [logging.StreamHandler(sys.stdout)]
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_path, encoding='utf-8'))
    logging.basicConfig(
        level=numeric_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=handlers
    )
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    return logging.getLogger(__name__)

logger = setup_logging()

# ═══════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════
def _safe_int(value, default: Optional[int] = None) -> Optional[int]:
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def generate_output_filename(base_name: str = 'metal_bands', output_dir: str = '../data') -> Path:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    filename = f"{base_name}_{timestamp}.json"
    filepath = output_path / filename
    latest_link = output_path / f"{base_name}_latest.json"
    if latest_link.exists() or latest_link.is_symlink():
        try:
            latest_link.unlink()
        except OSError:
            pass
    try:
        latest_link.symlink_to(filename)
        logger.info(f"🔗 Lien symbolique créé: {latest_link} -> {filename}")
    except OSError:
        latest_file = output_path / f"{base_name}_latest.txt"
        try:
            with open(latest_file, 'w', encoding='utf-8') as f:
                f.write(filename)
        except OSError:
            pass
    return filepath

def is_placeholder(url: Optional[str]) -> bool:
    """Détecte les images placeholder (à rejeter)."""
    if not url:
        return True
    lowered = url.lower()
    placeholder_signatures = ["2a96cbd8b46e442fc41c2b86b821562f", "c6f59c1e5e7240a4c0d427abd71f3dbb", "noimage", "placeholder"]
    return any(sig in lowered for sig in placeholder_signatures)

def pick_best_lastfm_image(images: List[Dict]) -> Optional[str]:
    if isinstance(images, dict):
        images = [images]
    by_size = {img.get('size'): (img.get('#text') or '') for img in images if isinstance(img, dict)}
    for size in LASTFM_SIZE_ORDER:
        url = by_size.get(size)
        if not is_placeholder(url):
            return url
    return None

def normalize_album_title(title: str) -> str:
    if not title:
        return ''
    normalized = title.lower()
    normalized = re.sub(r'\([^)]*\)', '', normalized)
    normalized = re.sub(r'\[[^\]]*\]', '', normalized)
    normalized = re.sub(r'[…_\-/]', ' ', normalized)
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

def get_discogs_style_from_genre(genre: str) -> str:
    """✨ CORRIGÉ : Couverture explicite des sous-genres extrêmes."""
    if not genre:
        return 'Heavy Metal'
    genre_lower = genre.lower()
    if 'black metal' in genre_lower: return 'Black Metal'
    if ('death metal' in genre_lower or 'grindcore' in genre_lower or
        'goregrind' in genre_lower or 'pornogrind' in genre_lower or
        'noisecore' in genre_lower): return 'Death Metal'
    if 'thrash metal' in genre_lower or 'industrial metal' in genre_lower: return 'Thrash Metal'
    if 'power metal' in genre_lower: return 'Power Metal'
    if 'doom metal' in genre_lower: return 'Doom Metal'
    if 'progressive metal' in genre_lower or 'avant-garde' in genre_lower or 'experimental' in genre_lower: return 'Progressive Metal'
    if 'folk metal' in genre_lower or 'pagan metal' in genre_lower or 'viking metal' in genre_lower: return 'Folk Metal'
    if 'metalcore' in genre_lower or 'core' in genre_lower or 'mathcore' in genre_lower: return 'Metalcore'
    if 'heavy metal' in genre_lower or 'metal' in genre_lower or 'glam metal' in genre_lower: return 'Heavy Metal'
    return 'Heavy Metal'

def sanitize_mb_query(text: str) -> str:
    """Échappe les caractères spéciaux pour les requêtes Lucene de MusicBrainz."""
    if not text:
        return ""
    special_chars = r'[\+\-\!\(\)\{\}\[\]\^\"\'\~\*\?\:\\\/]'
    return re.sub(special_chars, r'\\\g<0>', text)

def clean_biography(bio_content: str) -> str:
    if not bio_content:
        return ''
    clean = re.sub(r'<[^>]+>', '', bio_content)
    clean = re.sub(r'\s*(?:Read more|Lire la suite|Mehr lesen|Más información|Leggi tutto).*$', '', clean, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'https?://www\.last\.fm[^\s]*', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    if MAX_BIO_LENGTH is not None:
        return clean[:MAX_BIO_LENGTH]
    return clean

def iso_to_country_name(iso_code: str) -> str:
    if not iso_code:
        return 'Unknown'
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

# ═══════════════════════════════════════════════════════════
# DICTIONNAIRES DES CODES D'ERREUR
# ═══════════════════════════════════════════════════════════
LASTFM_ERROR_CODES = {
    2: "Invalid method", 4: "Authentication failed", 5: "Invalid API key",
    6: "Invalid session key", 8: "Operation failed", 10: "❌ INVALID API KEY",
    11: "Service offline", 16: "Service temporarily unavailable",
    26: "❌ API KEY SUSPENDED", 27: "❌ API KEY EXPIRED", 29: "⚠️ RATE LIMIT EXCEEDED",
}
LASTFM_PERMANENT_ERRORS = {5, 10, 26, 27}
LASTFM_TEMPORARY_ERRORS = {8, 11, 16, 28, 29, 30}
MUSICBRAINZ_PERMANENT_ERRORS = {400, 401, 403, 404, 405, 406}
MUSICBRAINZ_TEMPORARY_ERRORS = {408, 413, 429, 500, 502, 503, 504}
DISCOGS_PERMANENT_ERRORS = {400, 401, 403, 404, 405, 406, 415, 422}
DISCOGS_TEMPORARY_ERRORS = {408, 413, 429, 500, 502, 503, 504}

# ═══════════════════════════════════════════════════════════
# MODE TEST
# ═══════════════════════════════════════════════════════════
def test_services(insecure: bool = False, proxy: Optional[str] = None) -> bool:
    logger.info("🔍 TEST DE CONNEXION AUX SERVICES API")
    logger.info("=" * 80)
    all_ok = True
    protocol = "HTTP" if insecure else "HTTPS"
    session = requests.Session()
    if proxy:
        session.proxies = {'http': proxy, 'https': proxy}
    
    logger.info(f"\n🌐 Last.fm ({protocol}):")
    try:
        socket.gethostbyname('ws.audioscrobbler.com')
        logger.info("   ✅ DNS résolu")
    except Exception as e:
        logger.error(f"   ❌ DNS échoué: {e}")
        all_ok = False
        
    if LASTFM_API_KEY:
        try:
            base_url = LASTFM_API_URL_HTTP if insecure else LASTFM_API_URL_HTTPS
            response = session.get(base_url, params={'method': 'artist.getinfo', 'artist': 'Metallica', 'api_key': LASTFM_API_KEY, 'format': 'json'}, timeout=15)
            if response.status_code == 200:
                data = response.json()
                if data.get('artist'):
                    logger.info("   ✅ Clé API valide")
                elif 'error' in data:
                    logger.error(f"   ❌ {LASTFM_ERROR_CODES.get(data.get('error'), 'Erreur')}")
                    all_ok = False
            else:
                logger.error(f"   ❌ Erreur HTTP {response.status_code}")
                all_ok = False
        except Exception as e:
            logger.error(f"   ❌ Connexion échouée: {e}")
            all_ok = False
    else:
        logger.error("   ❌ Clé API manquante")
        all_ok = False

    logger.info("\n🎵 MusicBrainz:")
    try:
        response = session.get('https://musicbrainz.org/ws/2/artist/65f4f0c5-ef9e-490c-aee3-909e7ae6b2ab?fmt=json', headers={'User-Agent': 'MetalPedia/1.0.0 (test)'}, timeout=15)
        if response.status_code == 200:
            logger.info("   ✅ Service disponible")
        else:
            logger.error(f"   ❌ Erreur HTTP {response.status_code}")
            all_ok = False
    except Exception as e:
        logger.error(f"   ❌ Connexion échouée: {e}")
        all_ok = False

    logger.info("\n💿 Discogs:")
    if DISCOGS_TOKEN:
        try:
            response = session.get('https://api.discogs.com/database/search', params={'q': 'Metallica', 'type': 'artist', 'per_page': 1}, headers={'User-Agent': 'MetalPedia/1.0.0 (test)', 'Authorization': f'Discogs token={DISCOGS_TOKEN}'}, timeout=15)
            if response.status_code == 200:
                logger.info("   ✅ Token valide")
            else:
                logger.error(f"   ❌ Erreur HTTP {response.status_code}")
                all_ok = False
        except Exception as e:
            logger.error(f"   ❌ Connexion échouée: {e}")
            all_ok = False
    else:
        logger.info("   ℹ️  Token optionnel non fourni")
        
    logger.info("\n" + "=" * 80)
    if all_ok:
        logger.info(f"✅ Tous les services sont accessibles ! ({protocol})")
    else:
        logger.error("❌ Des problèmes ont été détectés.")
    return all_ok

# ═══════════════════════════════════════════════════════════
# ✨ SOUS-GENRES METAL ÉTENDUS (COMPLÉTÉ)
# ═══════════════════════════════════════════════════════════
METAL_TAGS = [
    'heavy metal', 'thrash metal', 'death metal', 'black metal', 'power metal', 'doom metal',
    'progressive metal', 'folk metal', 'metalcore', 'symphonic metal', 'gothic metal', 'nu metal',
    'groove metal', 'industrial metal', 'speed metal', 'melodic death metal', 'brutal death metal',
    'technical death metal', 'viking metal', 'pagan metal', 'sludge metal', 'stoner metal',
    'post-metal', 'djent', 'grindcore', 'deathcore', 'swedish death metal', 'finnish death metal',
    'norwegian black metal', 'symphonic black metal', 'epic metal', 'true metal',
    'avant-garde metal', 'experimental metal', 'industrial', 'cyber metal', 'neue deutsche härte',
    'folk black metal', 'viking black metal', 'goregrind', 'pornogrind', 'noisecore',
    'glam metal', 'mathcore',
]
METAL_GENRES = {
    'black metal', 'death metal', 'thrash metal', 'heavy metal', 'power metal', 'doom metal',
    'progressive metal', 'folk metal', 'symphonic metal', 'gothic metal', 'nu metal', 'metalcore',
    'groove metal', 'industrial metal', 'speed metal', 'grindcore', 'deathcore', 'sludge metal',
    'stoner metal', 'viking metal', 'pagan metal', 'post-metal', 'djent', 'melodic death metal',
    'brutal death metal', 'technical death metal', 'epic metal', 'true metal', 'swedish death metal',
    'finnish death metal', 'norwegian black metal', 'symphonic black metal', 'avant-garde metal',
    'experimental metal', 'industrial metal',
    # ✨ NOUVEAUX GENRES AJOUTÉS
    'goregrind', 'pornogrind', 'noisecore', 'glam metal', 'mathcore',
}
TAG_TO_COUNTRY = {
    'swedish': 'Sweden', 'norwegian': 'Norway', 'finnish': 'Finland', 'danish': 'Denmark',
    'icelandic': 'Iceland', 'german': 'Germany', 'french': 'France', 'british': 'United Kingdom',
    'english': 'United Kingdom', 'american': 'United States', 'canadian': 'Canada',
    'australian': 'Australia', 'brazilian': 'Brazil', 'japanese': 'Japan', 'polish': 'Poland',
    'russian': 'Russia', 'greek': 'Greece', 'italian': 'Italy', 'spanish': 'Spain',
    'portuguese': 'Portugal', 'dutch': 'Netherlands', 'belgian': 'Belgium', 'swiss': 'Switzerland',
    'austrian': 'Austria', 'hungarian': 'Hungary', 'czech': 'Czechia', 'romanian': 'Romania',
    'ukrainian': 'Ukraine', 'israeli': 'Israel', 'turkish': 'Turkey', 'mexican': 'Mexico',
    'argentine': 'Argentina', 'chilean': 'Chile', 'colombian': 'Colombia', 'chinese': 'China',
    'korean': 'South Korea', 'indian': 'India', 'south african': 'South Africa', 'scandinavian': 'Sweden', 'baltic': 'Latvia',
}
ISO_TO_COUNTRY = {
    'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan', 'AL': 'Albania', 'AM': 'Armenia',
    'AO': 'Angola', 'AR': 'Argentina', 'AT': 'Austria', 'AU': 'Australia', 'AZ': 'Azerbaijan',
    'BA': 'Bosnia and Herzegovina', 'BD': 'Bangladesh', 'BE': 'Belgium', 'BG': 'Bulgaria', 'BH': 'Bahrain',
    'BI': 'Burundi', 'BJ': 'Benin', 'BN': 'Brunei Darussalam', 'BO': 'Bolivia', 'BR': 'Brazil',
    'BS': 'Bahamas', 'BT': 'Bhutan', 'BW': 'Botswana', 'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada',
    'CD': 'Congo (Democratic Republic)', 'CF': 'Central African Republic', 'CG': 'Congo', 'CH': 'Switzerland',
    'CI': 'Côte d\'Ivoire', 'CL': 'Chile', 'CM': 'Cameroon', 'CN': 'China', 'CO': 'Colombia',
    'CR': 'Costa Rica', 'CU': 'Cuba', 'CV': 'Cabo Verde', 'CY': 'Cyprus', 'CZ': 'Czechia', 'DE': 'Germany',
    'DJ': 'Djibouti', 'DK': 'Denmark', 'DO': 'Dominican Republic', 'DZ': 'Algeria', 'EC': 'Ecuador',
    'EE': 'Estonia', 'EG': 'Egypt', 'ER': 'Eritrea', 'ES': 'Spain', 'ET': 'Ethiopia', 'FI': 'Finland',
    'FJ': 'Fiji', 'FM': 'Micronesia', 'FO': 'Faroe Islands', 'FR': 'France', 'GA': 'Gabon', 'GB': 'United Kingdom',
    'GD': 'Grenada', 'GE': 'Georgia', 'GF': 'French Guiana', 'GH': 'Ghana', 'GI': 'Gibraltar',
    'GL': 'Greenland', 'GM': 'Gambia', 'GN': 'Guinea', 'GP': 'Guadeloupe', 'GQ': 'Equatorial Guinea',
    'GR': 'Greece', 'GT': 'Guatemala', 'GU': 'Guam', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HK': 'Hong Kong',
    'HN': 'Honduras', 'HR': 'Croatia', 'HT': 'Haiti', 'HU': 'Hungary', 'ID': 'Indonesia', 'IE': 'Ireland',
    'IL': 'Israel', 'IM': 'Isle of Man', 'IN': 'India', 'IQ': 'Iraq', 'IR': 'Iran (Islamic Republic of)',
    'IS': 'Iceland', 'IT': 'Italy', 'JE': 'Jersey', 'JM': 'Jamaica', 'JO': 'Jordan', 'JP': 'Japan',
    'KE': 'Kenya', 'KG': 'Kyrgyzstan', 'KH': 'Cambodia', 'KI': 'Kiribati', 'KM': 'Comoros',
    'KN': 'Saint Kitts and Nevis', 'KP': 'North Korea', 'KR': 'South Korea', 'KW': 'Kuwait',
    'KY': 'Cayman Islands', 'KZ': 'Kazakhstan', 'LA': 'Lao People\'s Democratic Republic', 'LB': 'Lebanon',
    'LC': 'Saint Lucia', 'LI': 'Liechtenstein', 'LK': 'Sri Lanka', 'LR': 'Liberia', 'LS': 'Lesotho',
    'LT': 'Lithuania', 'LU': 'Luxembourg', 'LV': 'Latvia', 'LY': 'Libya', 'MA': 'Morocco', 'MC': 'Monaco',
    'MD': 'Moldova (Republic of)', 'ME': 'Montenegro', 'MG': 'Madagascar', 'MH': 'Marshall Islands',
    'MK': 'North Macedonia', 'ML': 'Mali', 'MM': 'Myanmar', 'MN': 'Mongolia', 'MO': 'Macao',
    'MP': 'Northern Mariana Islands', 'MQ': 'Martinique', 'MR': 'Mauritania', 'MS': 'Montserrat',
    'MT': 'Malta', 'MU': 'Mauritius', 'MV': 'Maldives', 'MW': 'Malawi', 'MX': 'Mexico', 'MY': 'Malaysia',
    'MZ': 'Mozambique', 'NA': 'Namibia', 'NC': 'New Caledonia', 'NE': 'Niger', 'NF': 'Norfolk Island',
    'NG': 'Nigeria', 'NI': 'Nicaragua', 'NL': 'Netherlands', 'NO': 'Norway', 'NP': 'Nepal', 'NR': 'Nauru',
    'NU': 'Niue', 'NZ': 'New Zealand', 'OM': 'Oman', 'PA': 'Panama', 'PE': 'Peru', 'PF': 'French Polynesia',
    'PG': 'Papua New Guinea', 'PH': 'Philippines', 'PK': 'Pakistan', 'PL': 'Poland', 'PM': 'Saint Pierre and Miquelon',
    'PN': 'Pitcairn', 'PR': 'Puerto Rico', 'PS': 'Palestine, State of', 'PT': 'Portugal', 'PW': 'Palau',
    'PY': 'Paraguay', 'QA': 'Qatar', 'RE': 'Réunion', 'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russia',
    'RW': 'Rwanda', 'SA': 'Saudi Arabia', 'SB': 'Solomon Islands', 'SC': 'Seychelles', 'SD': 'Sudan',
    'SE': 'Sweden', 'SG': 'Singapore', 'SI': 'Slovenia', 'SK': 'Slovakia', 'SL': 'Sierra Leone',
    'SM': 'San Marino', 'SN': 'Senegal', 'SO': 'Somalia', 'SR': 'Suriname', 'SS': 'South Sudan',
    'ST': 'Sao Tome and Principe', 'SV': 'El Salvador', 'SY': 'Syrian Arab Republic', 'SZ': 'Eswatini',
    'TC': 'Turks and Caicos Islands', 'TD': 'Chad', 'TG': 'Togo', 'TH': 'Thailand', 'TJ': 'Tajikistan',
    'TK': 'Tokelau', 'TL': 'Timor-Leste', 'TM': 'Turkmenistan', 'TN': 'Tunisia', 'TO': 'Tonga',
    'TR': 'Turkey', 'TT': 'Trinidad and Tobago', 'TV': 'Tuvalu', 'TW': 'Taiwan (Province of China)',
    'TZ': 'Tanzania, United Republic of', 'UA': 'Ukraine', 'UG': 'Uganda', 'UM': 'United States Minor Outlying Islands',
    'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VA': 'Vatican City State',
    'VC': 'Saint Vincent and the Grenadines', 'VE': 'Venezuela (Bolivarian Republic of)',
    'VG': 'Virgin Islands (British)', 'VI': 'Virgin Islands (U.S.)', 'VN': 'Vietnam', 'VU': 'Vanuatu',
    'WF': 'Wallis and Futuna', 'WS': 'Samoa', 'YE': 'Yemen', 'YT': 'Mayotte', 'ZA': 'South Africa',
    'ZM': 'Zambia', 'ZW': 'Zimbabwe',
}

# ═══════════════════════════════════════════════════════════
# ✨ CACHE LOCAL AVEC SAUVEGARDE AUTOMATIQUE
# ═══════════════════════════════════════════════════════════
class JSONCache:
    def __init__(self, cache_path: str, name: str = "cache", save_interval: int = CACHE_SAVE_INTERVAL):
        self.cache_path = Path(cache_path)
        self.name = name
        self.save_interval = save_interval
        self.cache: Dict = {}
        self.hits = 0
        self.misses = 0
        self._new_entries = 0
        self._load()

    def _load(self):
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r', encoding='utf-8') as f:
                    self.cache = json.load(f)
                logger.info(f"📂 Cache {self.name} chargé: {len(self.cache)} entrées")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"⚠️  Impossible de charger le cache {self.name}: {e}")
                self.cache = {}

    def save(self):
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_path, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False)
        self._new_entries = 0

    def get(self, key: str) -> Optional[Dict]:
        if key in self.cache:
            self.hits += 1
            return self.cache[key]
        self.misses += 1
        return None

    def set(self, key: str, data: Dict):
        if key not in self.cache:
            self._new_entries += 1
            self.cache[key] = data
            if self._new_entries >= self.save_interval:
                self.save()
                logger.debug(f"💾 Cache {self.name} sauvegardé automatiquement ({len(self.cache)} entrées)")

    def stats(self) -> Dict[str, int]:
        return {'hits': self.hits, 'misses': self.misses, 'size': len(self.cache)}

# ═══════════════════════════════════════════════════════════
# CLIENT LAST.FM (AVEC OPTIMISATION RAPIDE SOLUTION A)
# ═══════════════════════════════════════════════════════════
class LastFmClient:
    def __init__(self, api_key: str, default_lang: str = 'fr', insecure: bool = False, proxy: Optional[str] = None):
        self.api_key = api_key
        self.default_lang = default_lang
        self.insecure = insecure
        self.session = requests.Session()
        if proxy:
            self.session.proxies = {'http': proxy, 'https': proxy}
        self.session.headers.update({
            'User-Agent': 'MetalPedia/1.0.0 (https://github.com/sebastienbats/MetalPedia)'
        })
        self.request_count = 0
        self.rate_limited_count = 0
        self.bio_stats = {'bio_fr': 0, 'bio_en': 0, 'bio_none': 0}
        self.image_stats = {'lastfm_info': 0, 'placeholder_filtered': 0, 'no_image': 0}
        self.album_stats = {
            'total_albums_fetched': 0,
            'albums_with_valid_mbid': 0,
            'albums_rejected_no_mbid': 0,
            'artists_with_albums': 0
        }
        self.base_url = LASTFM_API_URL_HTTP if insecure else LASTFM_API_URL_HTTPS
        self.cache = JSONCache(LASTFM_CACHE_FILE, "Last.fm", save_interval=CACHE_SAVE_INTERVAL)
        logger.info(f"🎵 Client Last.fm initialisé ({'HTTP' if insecure else 'HTTPS'}) - Filtrage MBID strict + optimisation rapide")

    def _request(self, params: Dict) -> Optional[Dict]:
        params['api_key'] = self.api_key
        params['format'] = 'json'
        endpoint = params.get('method', 'unknown')
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                time.sleep(LASTFM_DELAY)
                response = self.session.get(self.base_url, params=params, timeout=30)
                self.request_count += 1
                if response.status_code == 200:
                    data = response.json()
                    if 'error' in data:
                        error_code = data.get('error')
                        if error_code in LASTFM_PERMANENT_ERRORS:
                            logger.error(f"❌ Last.fm - Erreur {error_code}")
                            return None
                        elif error_code in LASTFM_TEMPORARY_ERRORS:
                            self.rate_limited_count += 1
                            time.sleep(30 * (attempt + 1))
                            continue
                        else:
                            return None
                    return data
                elif response.status_code == 403:
                    return None
                elif response.status_code == 429:
                    self.rate_limited_count += 1
                    time.sleep(60 * (attempt + 1))
                    continue
                elif response.status_code == 503:
                    self.rate_limited_count += 1
                    time.sleep(30 * (attempt + 1))
                    continue
                else:
                    time.sleep(2)
                    continue
            except requests.RequestException as e:
                logger.error(f"❌ Last.fm {endpoint} - Exception réseau: {e}")
                if attempt < max_attempts - 1:
                    time.sleep(5 * (attempt + 1))
                    continue
                return None

    def get_top_artists_by_tag(self, tag: str, limit: int = 100, page: int = 1) -> List[Dict]:
        data = self._request({'method': 'tag.gettopartists', 'tag': tag, 'limit': limit, 'page': page})
        if not data:
            return []
        artists = data.get('topartists', {}).get('artist', [])
        return artists if isinstance(artists, list) else []

    def get_artist_info(self, artist_name: str, lang: Optional[str] = None) -> Optional[Dict]:
        cache_key = f"{artist_name.lower().strip()}_{lang or 'none'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
        params = {'method': 'artist.getinfo', 'artist': artist_name, 'autocorrect': 1}
        if lang:
            params['lang'] = lang
        data = self._request(params)
        if data:
            artist_data = data.get('artist')
            if artist_data:
                self.cache.set(cache_key, artist_data)
                return artist_data
        return None

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

    def get_album_info(self, artist_name: str, album_name: str) -> Optional[Dict]:
        """✨ Récupère les infos d'un album spécifique pour garantir l'obtention du MBID."""
        cache_key = f"album_info:{artist_name.lower().strip()}:{album_name.lower().strip()}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
        params = {'method': 'album.getInfo', 'artist': artist_name, 'album': album_name, 'autocorrect': 1}
        data = self._request(params)
        if data and 'album' in data:
            album_data = data['album']
            self.cache.set(cache_key, album_data)
            return album_data
        return None

    def get_artist_albums(self, artist_name: str, limit: int = 100, max_pages: Optional[int] = None, max_albums: int = DEFAULT_MAX_ALBUMS) -> List[Dict]:
        """✨ SOLUTION A : Récupération optimisée des albums.
        
        Optimisations appliquées :
        1. Limite le nombre d'albums BRUTS traités à max_albums * RAW_ALBUMS_MULTIPLIER
        2. Supprime le fallback lent album.getInfo (trop de requêtes API)
        3. Arrêt immédiat dès que max_albums valides sont trouvés
        4. Clé de cache dynamique incluant max_albums
        """
        if max_albums <= 0:
            return []
        
        # ✨ Clé de cache dynamique incluant max_albums
        cache_key = f"albums:{artist_name.lower().strip()}:{max_albums}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached.get('albums', [])
        
        albums = []
        page = 1
        raw_albums_processed = 0  # ✨ SOLUTION A : Compteur d'albums bruts traités
        max_raw_albums = max_albums * RAW_ALBUMS_MULTIPLIER  # ✨ SOLUTION A : Limite d'albums bruts
        
        while len(albums) < max_albums:
            data = self._request({
                'method': 'artist.getTopAlbums',
                'artist': artist_name,
                'limit': limit,
                'page': page,
                'autocorrect': 1
            })
            if not data:
                break
            top_albums = data.get('topalbums', {})
            page_albums = top_albums.get('album', [])
            if isinstance(page_albums, dict):
                page_albums = [page_albums]
            if not page_albums:
                break
            
            for album in page_albums:
                # ✨ SOLUTION A : Arrêt immédiat si on a atteint le max d'albums valides
                if len(albums) >= max_albums:
                    break
                
                # ✨ SOLUTION A : Arrêt immédiat si on a traité trop d'albums bruts
                if raw_albums_processed >= max_raw_albums:
                    break
                
                raw_albums_processed += 1
                self.album_stats['total_albums_fetched'] += 1
                album_name = album.get('name')
                artist_data = album.get('artist', {})
                album_artist_name = artist_data.get('name') if isinstance(artist_data, dict) else artist_data
                
                # 1. Récupérer le MBID initial (parfois présent dans getTopAlbums)
                mbid = album.get('mbid')
                
                # ✨ SOLUTION A : Suppression du fallback album.getInfo (trop lent)
                # On ne garde que les MBID natifs fournis par getTopAlbums
                # Validation stricte : MBID doit faire exactement 36 caractères
                if not mbid or len(str(mbid).strip()) != 36:
                    self.album_stats['albums_rejected_no_mbid'] += 1
                    continue
                
                self.album_stats['albums_with_valid_mbid'] += 1
                album_image = pick_best_lastfm_image(album.get('image', []))
                album_url = album.get('url')
                
                albums.append({
                    'name': album_name,
                    'artist': album_artist_name,
                    'mbid': mbid.strip(),
                    'url': album_url,
                    'uri': album_url,
                    'playcount': album.get('playcount'),
                    'image': album_image,
                    'year': None,
                    'type': 'album',
                })
            
            # ✨ SOLUTION A : Arrêt de la pagination si on a atteint les limites
            if len(albums) >= max_albums:
                break
            if raw_albums_processed >= max_raw_albums:
                break
            
            attr = top_albums.get('@attr', {})
            try:
                total_pages = int(attr.get('totalPages', 1))
            except (TypeError, ValueError):
                total_pages = 1
            
            if page >= total_pages:
                break
            if max_pages is not None and page >= max_pages:
                break
            page += 1
        
        if albums:
            self.cache.set(cache_key, {
                'albums': albums,
                'fetched_at': datetime.now(timezone.utc).isoformat(),
                'count': len(albums)
            })
            self.album_stats['artists_with_albums'] += 1
            
        return albums

    def save_cache(self):
        if self.cache:
            self.cache.save()

    @property
    def stats(self):
        return {
            'api_requests': self.request_count,
            'rate_limited': self.rate_limited_count,
            'cache_size': len(self.cache.cache) if self.cache else 0,
            'cache_hits': self.cache.hits if self.cache else 0,
            'bio_fr': self.bio_stats.get('bio_fr', 0),
            'bio_en': self.bio_stats.get('bio_en', 0),
            'bio_none': self.bio_stats.get('bio_none', 0),
            'total_albums_fetched': self.album_stats.get('total_albums_fetched', 0),
            'albums_with_valid_mbid': self.album_stats.get('albums_with_valid_mbid', 0),
            'albums_rejected_no_mbid': self.album_stats.get('albums_rejected_no_mbid', 0),
            'artists_with_albums': self.album_stats.get('artists_with_albums', 0),
        }

# ═══════════════════════════════════════════════════════════
# CLIENT MUSICBRAINZ (avec optimisations anti-backoff)
# ═══════════════════════════════════════════════════════════
class MusicBrainzClient:
    def __init__(self, mb_delay: float = DEFAULT_MB_DELAY, use_cache: bool = True, proxy: Optional[str] = None):
        self.mb_delay = mb_delay
        self.session = requests.Session()
        if proxy:
            self.session.proxies = {'http': proxy, 'https': proxy}
        self.session.headers.update({
            'User-Agent': 'MetalPedia/1.0.0 ( https://github.com/sebastienbats/MetalPedia ; mailto:contact@metalpedia.dev )',
            'Accept': 'application/json',
        })
        self.request_count = 0
        self.cache_hits = 0
        self.rate_limited_count = 0
        self.cache = JSONCache(MB_CACHE_FILE, "MBID", save_interval=CACHE_SAVE_INTERVAL) if use_cache else None
        self.current_backoff = mb_delay
        self.max_backoff = 30.0
        self.member_stats = {'members_found': 0, 'bands_with_members': 0}
        self.country_stats = {'resolved_direct': 0, 'resolved_hierarchy': 0, 'unresolved': 0}
        self.genre_stats = {'total_raw_genres': 0, 'filtered_genres': 0}
        logger.info(f"🎵 Client MusicBrainz initialisé (délai: {mb_delay}s)")

    def filter_allowed_genres(self, raw_genres: List[Dict]) -> List[Dict]:
        if not isinstance(raw_genres, list):
            return []
        filtered_genres = []
        for g in raw_genres:
            genre_name = g.get('name', '').strip().lower()
            self.genre_stats['total_raw_genres'] += 1
            if genre_name in ALLOWED_METAL_GENRES:
                filtered_genres.append({'name': genre_name, 'count': g.get('count', 0)})
                self.genre_stats['filtered_genres'] += 1
        filtered_genres.sort(key=lambda x: x['count'], reverse=True)
        return filtered_genres

    def get_artist(self, mbid: str) -> Optional[Dict]:
        if not mbid:
            return None
        if self.cache:
            cached = self.cache.get(f"artist:{mbid}")
            if cached is not None:
                self.cache_hits += 1
                return cached.get('data')
        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)
                url = f"{MUSICBRAINZ_API_URL}artist/{mbid}?fmt=json&inc=genres+ratings+url-rels+artist-rels"
                response = self.session.get(url, timeout=30)
                self.request_count += 1
                if response.status_code == 200:
                    self.current_backoff = self.mb_delay
                    data = response.json()
                    if self.cache:
                        self.cache.set(f"artist:{mbid}", {'data': data})
                    return data
                elif response.status_code == 404:
                    self.current_backoff = self.mb_delay
                    return None
                elif response.status_code in MUSICBRAINZ_PERMANENT_ERRORS:
                    return None
                elif response.status_code in MUSICBRAINZ_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
                    retry_after = response.headers.get('Retry-After')
                    wait_time = max(1, int(retry_after) if retry_after else int(self.current_backoff))
                    if attempt == max_attempts - 1:
                        return None
                    time.sleep(wait_time)
                    continue
                else:
                    return None
            except requests.RequestException as e:
                logger.error(f"❌ MusicBrainz - Exception réseau: {e}")
                time.sleep(2)
                return None

    def search_artist_mbid(self, artist_name: str) -> Optional[str]:
        if not artist_name:
            return None
        cache_key = f"search_artist:{artist_name.lower().strip()}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                self.cache_hits += 1
                return cached.get('mbid')
        safe_artist_name = sanitize_mb_query(artist_name)
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)
                response = self.session.get(f"{MUSICBRAINZ_API_URL}artist", params={'query': f'artist:"{safe_artist_name}"', 'fmt': 'json', 'limit': 1}, timeout=30)
                self.request_count += 1
                if response.status_code == 200:
                    self.current_backoff = self.mb_delay
                    data = response.json()
                    artists = data.get('artists', [])
                    if artists:
                        best_match = artists[0]
                        score = best_match.get('score', 0)
                        if score >= MB_MIN_SCORE:
                            mbid = best_match.get('id')
                            if self.cache:
                                self.cache.set(cache_key, {'mbid': mbid, 'score': score})
                            return mbid
                        else:
                            if self.cache:
                                self.cache.set(cache_key, {'mbid': None, 'score': score})
                            return None
                    if self.cache:
                        self.cache.set(cache_key, {'mbid': None, 'score': 0})
                    return None
                elif response.status_code == 404:
                    if self.cache:
                        self.cache.set(cache_key, {'mbid': None, 'score': 0})
                    return None
                elif response.status_code in MUSICBRAINZ_PERMANENT_ERRORS:
                    return None
                elif response.status_code in MUSICBRAINZ_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
                    if attempt == max_attempts - 1:
                        return None
                    time.sleep(int(self.current_backoff))
                    continue
                else:
                    return None
            except requests.RequestException as e:
                logger.error(f"❌ MusicBrainz artist search - Exception: {e}")
                time.sleep(2)
                return None

    def search_release_group_mbid(self, album_title: str, artist_name: str) -> Optional[str]:
        if not album_title or not artist_name:
            return None
        cache_key = f"search_release_group:{artist_name.lower().strip()}:{album_title.lower().strip()}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                self.cache_hits += 1
                return cached.get('mbid')
        safe_title = sanitize_mb_query(album_title)
        safe_artist = sanitize_mb_query(artist_name)
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)
                response = self.session.get(f"{MUSICBRAINZ_API_URL}release-group", params={'query': f'release:"{safe_title}" AND artist:"{safe_artist}" AND type:album', 'fmt': 'json', 'limit': 1}, timeout=30)
                self.request_count += 1
                if response.status_code == 200:
                    self.current_backoff = self.mb_delay
                    data = response.json()
                    release_groups = data.get('release-groups', [])
                    if release_groups:
                        best_match = release_groups[0]
                        score = best_match.get('score', 0)
                        if score >= MB_MIN_SCORE:
                            mbid = best_match.get('id')
                            if self.cache:
                                self.cache.set(cache_key, {'mbid': mbid, 'score': score})
                            return mbid
                        else:
                            if self.cache:
                                self.cache.set(cache_key, {'mbid': None, 'score': score})
                            return None
                    if self.cache:
                        self.cache.set(cache_key, {'mbid': None, 'score': 0})
                    return None
                elif response.status_code == 404:
                    if self.cache:
                        self.cache.set(cache_key, {'mbid': None, 'score': 0})
                    return None
                elif response.status_code in MUSICBRAINZ_PERMANENT_ERRORS:
                    return None
                elif response.status_code in MUSICBRAINZ_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
                    if attempt == max_attempts - 1:
                        return None
                    time.sleep(int(self.current_backoff))
                    continue
                else:
                    return None
            except requests.RequestException as e:
                logger.error(f"❌ MusicBrainz release-group search - Exception: {e}")
                time.sleep(2)
                return None

    def get_release_group_discogs_uri(self, mbid: str) -> Optional[str]:
        """✨ Récupère l'URI Discogs officielle d'un Release Group via son MBID (inc=url-rels)."""
        if not mbid:
            return None
        cache_key = f"rg_discogs_uri:{mbid}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached.get('uri')
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)
                url = f"{MUSICBRAINZ_API_URL}release-group/{mbid}?inc=url-rels&fmt=json"
                response = self.session.get(url, timeout=30)
                self.request_count += 1
                if response.status_code == 200:
                    self.current_backoff = self.mb_delay
                    data = response.json()
                    relations = data.get('relations', [])
                    for rel in relations:
                        if rel.get('type') == 'discogs' and 'resource' in rel.get('url', {}):
                            uri = rel['url']['resource']
                            if self.cache:
                                self.cache.set(cache_key, {'uri': uri})
                            return uri
                    # Negative caching : pas de lien Discogs trouvé
                    if self.cache:
                        self.cache.set(cache_key, {'uri': None})
                    return None
                elif response.status_code in MUSICBRAINZ_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
                    if attempt == max_attempts - 1:
                        return None
                    time.sleep(int(self.current_backoff))
                    continue
                else:
                    return None
            except requests.RequestException as e:
                logger.debug(f"⚠️ MusicBrainz RG Discogs URI - Exception: {e}")
                time.sleep(2)
                return None
        return None

    def extract_members(self, mbid: str) -> List[Dict]:
        if not mbid:
            return []
        artist_data = self.get_artist(mbid)
        if not artist_data:
            return []
        relations = artist_data.get('relations', [])
        members = []
        seen_names = set()
        for rel in relations:
            if rel.get('type') == 'member of band' and rel.get('direction') == 'backward':
                member_artist = rel.get('artist', {})
                name = member_artist.get('name', '').strip()
                if not name:
                    continue
                name_key = name.lower()
                if name_key in seen_names:
                    continue
                seen_names.add(name_key)
                attributes = rel.get('attributes', [])
                role = ', '.join(attributes) if attributes else 'musician'
                members.append({'name': name, 'role': role, 'source': 'musicbrainz', 'begin': rel.get('begin'), 'end': rel.get('end'), 'ended': rel.get('ended', False)})
        if members:
            self.member_stats['members_found'] += len(members)
            self.member_stats['bands_with_members'] += 1
        return members

    def resolve_area_to_country(self, area_data: Dict) -> Optional[str]:
        if not area_data:
            return None
        iso_codes = area_data.get('iso-3166-1-codes', [])
        if iso_codes:
            self.country_stats['resolved_direct'] += 1
            return iso_to_country_name(iso_codes[0])
        if area_data.get('type', '') == 'Country':
            self.country_stats['resolved_direct'] += 1
            return area_data.get('name')
        area_id = area_data.get('id')
        if not area_id:
            return None
        cache_key = f"area_country:{area_id}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                self.cache_hits += 1
                return cached.get('country')
        try:
            base_delay = min(self.current_backoff, self.max_backoff)
            jitter = base_delay * 0.2 * (random.random() * 2 - 1)
            delay = max(0.5, base_delay + jitter)
            time.sleep(delay)
            response = self.session.get(f"{MUSICBRAINZ_API_URL}area/{area_id}", params={'inc': 'area-rels', 'fmt': 'json'}, timeout=30)
            self.request_count += 1
            if response.status_code == 200:
                self.current_backoff = self.mb_delay
                area_details = response.json()
                iso_codes = area_details.get('iso-3166-1-codes', [])
                if iso_codes:
                    country = iso_to_country_name(iso_codes[0])
                    if self.cache:
                        self.cache.set(cache_key, {'country': country})
                    self.country_stats['resolved_direct'] += 1
                    return country
                relations = area_details.get('relations', [])
                for rel in relations:
                    if rel.get('type') == 'part of' and rel.get('direction') == 'forward':
                        parent_area = rel.get('area', {})
                        if parent_area.get('type', '') == 'Country':
                            parent_iso_codes = parent_area.get('iso-3166-1-codes', [])
                            if parent_iso_codes:
                                country = iso_to_country_name(parent_iso_codes[0])
                                if self.cache:
                                    self.cache.set(cache_key, {'country': country})
                                self.country_stats['resolved_hierarchy'] += 1
                                return country
                            country = parent_area.get('name')
                            if self.cache:
                                self.cache.set(cache_key, {'country': country})
                            self.country_stats['resolved_hierarchy'] += 1
                            return country
                        parent_iso = parent_area.get('iso-3166-1-codes', [])
                        if parent_iso:
                            country = iso_to_country_name(parent_iso[0])
                            if self.cache:
                                self.cache.set(cache_key, {'country': country})
                            self.country_stats['resolved_hierarchy'] += 1
                            return country
                if self.cache:
                    self.cache.set(cache_key, {'country': None})
                self.country_stats['unresolved'] += 1
                return None
            return None
        except requests.RequestException as e:
            logger.warning(f"⚠️  Erreur lors de la résolution de la zone: {e}")
            return None

    def extract_country_formed_genres_ratings(self, mbid: str):
        artist_data = self.get_artist(mbid)
        if not artist_data:
            return None, None, None, None, None, [], None, None
        country = None
        if artist_data.get('country'):
            country = iso_to_country_name(artist_data['country'])
        else:
            begin_area = artist_data.get('begin-area', {})
            if begin_area:
                country = self.resolve_area_to_country(begin_area)
            if not country:
                area = artist_data.get('area', {})
                if area:
                    country = self.resolve_area_to_country(area)
            if not country:
                begin_area = artist_data.get('begin-area', {})
                if begin_area and begin_area.get('name', '') in set(ISO_TO_COUNTRY.values()):
                    country = begin_area.get('name', '')
        formed = None
        formed_date = None
        life_span = artist_data.get('life-span', {})
        begin_date = life_span.get('begin', '')
        if begin_date:
            formed_date = begin_date
            try:
                year = int(begin_date[:4])
                if 1960 <= year <= datetime.now().year:
                    formed = year
            except (ValueError, TypeError):
                pass
        ended = life_span.get('ended', None)
        end_date = life_span.get('end', None)
        genres_list = self.filter_allowed_genres(artist_data.get('genres', []))
        rating = None
        rating_votes = None
        raw_rating = artist_data.get('rating', {})
        if raw_rating:
            rating = raw_rating.get('value')
            rating_votes = raw_rating.get('votes-count')
        return country, formed, ended, end_date, formed_date, genres_list, rating, rating_votes

    def get_artist_image(self, mbid: str) -> Optional[str]:
        if not mbid:
            return None
        artist_data = self.get_artist(mbid)
        if not artist_data:
            return None
        for rel in artist_data.get('relations', []):
            if rel.get('type') != 'image':
                continue
            resource = rel.get('url', {}).get('resource', '')
            parsed = urlparse(resource)
            if parsed.netloc.endswith('wikimedia.org') and '/wiki/File:' in parsed.path:
                file_title = 'File:' + unquote(parsed.path.split('/wiki/File:', 1)[1])
                try:
                    response = self.session.get('https://commons.wikimedia.org/w/api.php', params={'action': 'query', 'titles': file_title, 'prop': 'imageinfo', 'iiprop': 'url', 'iiurlwidth': 800, 'format': 'json'}, headers={'User-Agent': 'MetalPedia/1.0.0'}, timeout=15)
                    if response.status_code == 200:
                        pages = response.json().get('query', {}).get('pages', {})
                        for page in pages.values():
                            infos = page.get('imageinfo') or []
                            if infos:
                                return infos[0].get('thumburl') or infos[0].get('url')
                except requests.RequestException:
                    pass
        return None

    def get_release_group_year(self, mbid: str) -> Optional[int]:
        if not mbid:
            return None
        cache_key = f"rg_year:{mbid}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached.get('year')
        try:
            base_delay = min(self.current_backoff, self.max_backoff)
            jitter = base_delay * 0.2 * (random.random() * 2 - 1)
            delay = max(0.5, base_delay + jitter)
            time.sleep(delay)
            response = self.session.get(f"{MUSICBRAINZ_API_URL}release-group/{mbid}?fmt=json", timeout=15)
            self.request_count += 1
            if response.status_code == 200:
                self.current_backoff = self.mb_delay
                data = response.json()
                date = data.get('first-release-date') or data.get('date')
                if date:
                    try:
                        year = int(date[:4])
                        if self.cache:
                            self.cache.set(cache_key, {'year': year})
                        return year
                    except ValueError:
                        pass
            elif response.status_code in MUSICBRAINZ_TEMPORARY_ERRORS:
                self.rate_limited_count += 1
                self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
        except requests.RequestException:
            pass
        return None

    def save_cache(self):
        if self.cache:
            self.cache.save()

    @property
    def stats(self):
        stats = {
            'api_requests': self.request_count,
            'rate_limited': self.rate_limited_count,
            'cache_hits': self.cache_hits,
            'members_found': self.member_stats.get('members_found', 0),
            'bands_with_members': self.member_stats.get('bands_with_members', 0),
            'country_resolved_direct': self.country_stats.get('resolved_direct', 0),
            'country_resolved_hierarchy': self.country_stats.get('resolved_hierarchy', 0),
            'country_unresolved': self.country_stats.get('unresolved', 0),
            'total_raw_genres': self.genre_stats.get('total_raw_genres', 0),
            'filtered_metal_genres': self.genre_stats.get('filtered_genres', 0),
        }
        if self.cache:
            stats['cache_size'] = self.cache.stats()['size']
        return stats

# ═══════════════════════════════════════════════════════════
# CLIENT COVER ART ARCHIVE
# ═══════════════════════════════════════════════════════════
class CoverArtArchiveClient:
    def __init__(self, use_cache: bool = True, proxy: Optional[str] = None):
        self.session = requests.Session()
        if proxy:
            self.session.proxies = {'http': proxy, 'https': proxy}
        self.session.headers.update({'User-Agent': 'MetalPedia/1.0.0', 'Accept': 'application/json'})
        self.request_count = 0
        self.covers_found = 0
        self.covers_missing = 0
        self.last_request_time = 0
        self.cache = JSONCache(CAA_CACHE_FILE, "CoverArt", save_interval=CACHE_SAVE_INTERVAL) if use_cache else None
        logger.info("🎨 Client Cover Art Archive initialisé")

    def _request(self, path: str) -> Optional[Dict]:
        now = time.time()
        if now - self.last_request_time < CAA_DELAY:
            time.sleep(CAA_DELAY - (now - self.last_request_time))
        self.last_request_time = time.time()
        try:
            response = self.session.get(f"{COVERART_ARCHIVE_URL}/{path}", timeout=30)
            self.request_count += 1
            if response.status_code == 200:
                return response.json()
            elif response.status_code in (404, 503):
                return None
            return None
        except (requests.RequestException, ValueError):
            return None

    def get_front_image(self, mbid: str, kind: str = 'release-group') -> Optional[str]:
        if not mbid:
            return None
        cache_key = f"{kind}:{mbid}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached.get('url')
        data = self._request(f"{kind}/{mbid}")
        url = None
        if data:
            images = data.get('images', [])
            if isinstance(images, list) and images:
                front = next((img for img in images if img.get('front')), images[0])
                thumbnails = front.get('thumbnails', {}) or {}
                url = thumbnails.get(CAA_THUMB_SIZE) or thumbnails.get('500') or thumbnails.get('1200') or thumbnails.get('250') or front.get('image')
                if self.cache:
                    self.cache.set(cache_key, {'url': url})
        if url:
            self.covers_found += 1
        else:
            self.covers_missing += 1
        return url

    def get_cover_for_album(self, mbid: str) -> Optional[str]:
        url = self.get_front_image(mbid, kind='release-group')
        if not url:
            url = self.get_front_image(mbid, kind='release')
        return url

    def save_cache(self):
        if self.cache:
            self.cache.save()

    @property
    def stats(self):
        stats = {'api_requests': self.request_count, 'covers_found': self.covers_found, 'covers_missing': self.covers_missing}
        if self.cache:
            stats['cache_size'] = self.cache.stats()['size']
        return stats

# ═══════════════════════════════════════════════════════════
# CLIENT DISCOGS
# ═══════════════════════════════════════════════════════════
class DiscogsClient:
    def __init__(self, token: Optional[str] = None, use_cache: bool = True, proxy: Optional[str] = None):
        self.token = token
        self.session = requests.Session()
        if proxy:
            self.session.proxies = {'http': proxy, 'https': proxy}
        self.session.headers.update({'User-Agent': 'MetalPedia/1.0.0', 'Accept': 'application/json'})
        if token:
            self.session.headers.update({'Authorization': f'Discogs token={token}'})
            logger.info("💿 Client Discogs initialisé AVEC token")
        else:
            logger.info("💿 Client Discogs initialisé SANS token")
        self.request_count = 0
        self.rate_limited_count = 0
        self.cache = JSONCache(DISCOGS_CACHE_FILE, "Discogs", save_interval=CACHE_SAVE_INTERVAL) if use_cache else None
        self.tracklist_cache = JSONCache(TRACKLIST_CACHE_FILE, "Tracklist", save_interval=CACHE_SAVE_INTERVAL) if use_cache else None
        self.last_request_time = 0
        self.album_enrichment_stats = {'enriched': 0, 'not_found': 0, 'total': 0}

    def _request(self, endpoint: str, params: Optional[Dict] = None):
        now = time.time()
        if now - self.last_request_time < DISCOGS_DELAY:
            time.sleep(DISCOGS_DELAY - (now - self.last_request_time))
        self.last_request_time = time.time()
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = self.session.get(f"{DISCOGS_API_URL}{endpoint}", params=params, timeout=30)
                self.request_count += 1
                if response.status_code == 200:
                    return response.json()
                elif response.status_code in DISCOGS_PERMANENT_ERRORS:
                    if response.status_code == 401:
                        logger.error("   → Vérifiez votre DISCOGS_TOKEN dans .env")
                    return None
                elif response.status_code in DISCOGS_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    if response.status_code == 429:
                        time.sleep(int(response.headers.get('Retry-After', 60)))
                    else:
                        time.sleep(5 * (attempt + 1))
                    continue
                return None
            except requests.RequestException as e:
                logger.error(f"❌ Discogs - Exception réseau: {e}")
                time.sleep(2 * (attempt + 1))
                return None

    def search_releases_by_style(self, artist_name: str, style: str, limit: int = 100) -> List[Dict]:
        releases = []
        page = 1
        while len(releases) < limit:
            result = self._request('database/search', {'q': artist_name, 'type': 'master', 'per_page': 100, 'page': page})
            if not result or 'results' not in result:
                break
            artist_name_lower = artist_name.lower()
            for item in result['results']:
                if artist_name_lower in item.get('title', '').lower():
                    releases.append({
                        'title': item.get('title'),
                        'year': item.get('year'),
                        'type': item.get('type'),
                        'uri': f"https://www.discogs.com/{item.get('type')}/{item.get('id')}",
                        'thumb': item.get('thumb'),
                        'id': item.get('id')
                    })
            pagination = result.get('pagination', {})
            if page >= pagination.get('pages', 1) or page > 5:
                break
            page += 1
        return releases[:limit]

    def enrich_albums_with_discogs(self, artist_name: str, genre: str, lastfm_albums: List[Dict], musicbrainz_client=None, include_tracks: bool = False) -> List[Dict]:
        """✨ Enrichissement Discogs avec priorité MBID → URI existant → recherche textuelle."""
        if not lastfm_albums:
            return lastfm_albums
        self.album_enrichment_stats['total'] += len(lastfm_albums)
        enriched_count = 0
        for album in lastfm_albums:
            lastfm_title = album.get('name', '')
            if not lastfm_title:
                continue
            discogs_uri = None
            # ✨ PRIORITÉ 1 : Utiliser le MBID garanti pour obtenir l'URI Discogs via MusicBrainz
            mbid = album.get('mbid')
            if mbid and musicbrainz_client:
                discogs_uri = musicbrainz_client.get_release_group_discogs_uri(mbid)
            # ✨ PRIORITÉ 2 : Fallback sur l'URI déjà présent dans l'album
            if not discogs_uri:
                uri = album.get('uri', '')
                if uri and 'discogs.com/master/' in uri:
                    discogs_uri = uri
            # ✨ PRIORITÉ 3 : Fallback sur la recherche textuelle (uniquement si MBID échoue)
            if not discogs_uri:
                discogs_releases = self.search_releases_by_style(artist_name, get_discogs_style_from_genre(genre), limit=50)
                discogs_titles = {normalize_album_title(r['title'].split(' - ', 1)[1] if ' - ' in r['title'] else r['title']): r for r in discogs_releases}
                matched_release = discogs_titles.get(normalize_album_title(lastfm_title))
                if matched_release:
                    discogs_uri = matched_release.get('uri')
            # ✨ ENRICHISSEMENT DIRECT via l'URI Discogs trouvé
            if discogs_uri:
                match = re.search(r'/master/(\d+)', discogs_uri)
                if match:
                    master_id = match.group(1)
                    cache_key = f"master:{master_id}"
                    master_data = None
                    if self.tracklist_cache:
                        cached = self.tracklist_cache.get(cache_key)
                        if cached:
                            master_data = cached
                    if not master_data:
                        time.sleep(DISCOGS_DELAY)
                        master_data = self._request(f'masters/{master_id}')
                    if self.tracklist_cache and master_data:
                        self.tracklist_cache.set(cache_key, master_data)
                    if master_data:
                        if not album.get('year') and master_data.get('year'):
                            album['year'] = master_data['year']
                        formats = master_data.get('main_release', {}).get('formats', [{}])
                        album['type'] = formats[0].get('name', 'album').lower() if formats else 'album'
                        album['uri'] = f"https://www.discogs.com/master/{master_id}"
                        if include_tracks and 'tracklist' in master_data:
                            album['tracks'] = [
                                {"position": str(t.get("position", "")), "title": t.get("title", ""), "duration": t.get("duration", "")}
                                for t in master_data['tracklist'] if t.get("title")
                            ]
                        discogs_thumb = master_data.get('thumb') or (master_data.get('images', [{}])[0].get('uri') if master_data.get('images') else None)
                        if discogs_thumb and (not album.get('image') or is_placeholder(album.get('image'))):
                            album['image'] = discogs_thumb
                            album['image_source'] = 'discogs'
                        enriched_count += 1
        # Déduplication robuste basée sur l'URI Discogs
        unique_albums, seen = [], set()
        for album in lastfm_albums:
            identifier = album.get('uri') or f"local:{normalize_album_title(album.get('name', ''))}"
            if identifier not in seen:
                seen.add(identifier)
                unique_albums.append(album)
        if enriched_count > 0:
            self.album_enrichment_stats['enriched'] += enriched_count
            logger.info(f"💿 Discogs: {enriched_count}/{len(lastfm_albums)} albums enrichis (via MBID prioritaire) pour '{artist_name}'")
        return unique_albums

    def enrich_artist(self, artist_name: str):
        cache_key = f"artist:{artist_name.lower().strip()}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached
        result = {'albums': [], 'members': [], 'image_url': None, 'image_source': None, 'discogs_id': None, 'discogs_uri': None}
        if self.token:
            try:
                search_resp = self._request('database/search', {'q': artist_name, 'type': 'artist', 'per_page': 1})
                if search_resp and search_resp.get('results'):
                    artist_id = search_resp['results'][0].get('id')
                    if artist_id:
                        result['discogs_id'] = artist_id
                        result['discogs_uri'] = f"https://www.discogs.com/artist/{artist_id}"
                        time.sleep(DISCOGS_DELAY)
                        artist_details = self._request(f'artists/{artist_id}')
                        if artist_details:
                            if artist_details.get('images'):
                                primary = next((i for i in artist_details['images'] if i.get('type') == 'primary'), artist_details['images'][0])
                                img_url = primary.get('uri') or primary.get('resource_url')
                                if img_url and not is_placeholder(img_url):
                                    result['image_url'] = img_url
                                    result['image_source'] = 'discogs'
                            if artist_details.get('members'):
                                result['members'] = [{'name': m.get('name', '').strip(), 'role': 'member', 'source': 'discogs', 'begin': None, 'end': None, 'ended': False} for m in artist_details['members'] if m.get('name', '').strip()]
            except Exception as e:
                logger.debug(f"⚠️  Erreur Discogs pour '{artist_name}': {e}")
        if self.cache:
            self.cache.set(cache_key, result)
        return result

    def enrich_album_year(self, album: Dict, artist_name: str, musicbrainz_client=None) -> Optional[int]:
        """✨ Enrichissement année avec priorité MBID → URI Discogs."""
        if album.get('year'):
            return album['year']
        mbid = album.get('mbid')
        # ✨ PRIORITÉ 1 : MBID via MusicBrainz (le plus fiable)
        if mbid and musicbrainz_client:
            year = musicbrainz_client.get_release_group_year(mbid)
            if year:
                return year
            # Si MusicBrainz n'a pas l'année, on tente de récupérer l'URI Discogs via MBID
            discogs_uri = musicbrainz_client.get_release_group_discogs_uri(mbid)
            if discogs_uri:
                album['uri'] = discogs_uri
        # ✨ PRIORITÉ 2 : Fallback sur l'URI Discogs
        uri = album.get('uri', '')
        if uri and 'discogs.com/master/' in uri:
            try:
                master_id = uri.split('/master/')[-1].split('-')[0]
                if master_id.isdigit():
                    cache_key = f"year:master:{master_id}"
                    cached = self.tracklist_cache.get(cache_key) if self.tracklist_cache else None
                    if cached is not None:
                        return cached.get('year')
                    time.sleep(DISCOGS_DELAY)
                    master_data = self._request(f'masters/{master_id}')
                    if master_data and master_data.get('year'):
                        year = master_data['year']
                        if self.tracklist_cache:
                            self.tracklist_cache.set(cache_key, {'year': year})
                        return year
            except Exception as e:
                logger.debug(f"⚠️ Erreur récupération année via URI Discogs: {e}")
        return None

    def save_cache(self):
        if self.cache:
            self.cache.save()
        if self.tracklist_cache:
            self.tracklist_cache.save()

    @property
    def stats(self):
        stats = {
            'api_requests': self.request_count,
            'rate_limited': self.rate_limited_count,
            'albums_enriched': self.album_enrichment_stats.get('enriched', 0),
            'albums_not_found': self.album_enrichment_stats.get('not_found', 0),
            'albums_total': self.album_enrichment_stats.get('total', 0)
        }
        if self.cache:
            stats['cache_size'] = self.cache.stats()['size']
        if self.tracklist_cache:
            stats['tracklist_cache_size'] = self.tracklist_cache.stats()['size']
        return stats

# ═══════════════════════════════════════════════════════════
# FILTRAGE ET STATISTIQUES
# ═══════════════════════════════════════════════════════════
def filter_bands_by_listeners(bands: List[Dict], min_listeners: int) -> Tuple[List[Dict], Dict]:
    if min_listeners <= 0:
        return bands, {'total_before': len(bands), 'total_after': len(bands), 'removed': 0, 'min_listeners': min_listeners}
    filtered = [b for b in bands if _safe_int(b.get('listeners', 0), 0) >= min_listeners]
    return filtered, {'total_before': len(bands), 'total_after': len(filtered), 'removed': len(bands) - len(filtered), 'min_listeners': min_listeners}

def filter_bands_by_pillar(bands: List[Dict], pillar: str) -> Tuple[List[Dict], Dict]:
    filtered = [b for b in bands if resolve_pillar(b.get('genre_pillar') or b.get('genre')) == pillar]
    return filtered, {'total_before': len(bands), 'total_after': len(filtered), 'removed': len(bands) - len(filtered), 'pillar': pillar}

def filter_albums_by_type(bands: List[Dict], album_types: Union[str, List[str]], max_per_band: Optional[int] = None) -> Tuple[List[Dict], Dict]:
    types_to_keep = {album_types} if isinstance(album_types, str) else set(album_types)
    stats = {'total_albums_before': 0, 'total_albums_after': 0, 'albums_removed': 0, 'bands_affected': 0, 'bands_empty_after_filter': 0, 'types_kept': list(types_to_keep)}
    filtered_bands = []
    for band in bands:
        albums = band.get('albums', [])
        stats['total_albums_before'] += len(albums)
        filtered_albums = [a for a in albums if a.get('type') in types_to_keep]
        if max_per_band is not None and len(filtered_albums) > max_per_band:
            filtered_albums = filtered_albums[:max_per_band]
        stats['total_albums_after'] += len(filtered_albums)
        stats['albums_removed'] += len(albums) - len(filtered_albums)
        if len(filtered_albums) < len(albums):
            stats['bands_affected'] += 1
        if len(filtered_albums) == 0 and len(albums) > 0:
            stats['bands_empty_after_filter'] += 1
        band_copy = band.copy()
        band_copy['albums'] = filtered_albums
        filtered_bands.append(band_copy)
    return filtered_bands, stats

def print_artist_statistics(bands: List[Dict]):
    if not bands:
        return
    total = len(bands)
    print("\n" + "=" * 80 + f"\n📊 STATISTIQUES DÉTAILLÉES DES ARTISTES RÉCUPÉRÉS ({total:,} artistes)\n" + "=" * 80)
    fields_to_check = [
        ('name', lambda b: bool(b.get('name'))), ('genre', lambda b: bool(b.get('genre'))),
        ('country', lambda b: bool(b.get('country')) and b.get('country') != 'Unknown'),
        ('formed', lambda b: b.get('formed') is not None), ('formed_date', lambda b: bool(b.get('formed_date'))),
        ('disbanded_date', lambda b: bool(b.get('disbanded_date'))), ('status', lambda b: bool(b.get('status'))),
        ('biography', lambda b: bool(b.get('biography'))), ('bio_lang', lambda b: bool(b.get('bio_lang')) and b.get('bio_lang') != 'none'),
        ('image_url', lambda b: bool(b.get('image_url'))), ('listeners', lambda b: b.get('listeners') is not None and b.get('listeners') > 0),
        ('mbid', lambda b: bool(b.get('mbid'))), ('original_name', lambda b: bool(b.get('original_name'))),
        ('rating', lambda b: b.get('rating') is not None), ('rating_votes', lambda b: b.get('rating_votes') is not None and b.get('rating_votes') > 0),
        ('discogs_id', lambda b: b.get('discogs_id') is not None), ('discogs_uri', lambda b: bool(b.get('discogs_uri'))),
        ('albums', lambda b: bool(b.get('albums'))), ('members', lambda b: bool(b.get('members')))
    ]
    print(f"\n{'Champ':<20} {'Remplis':<12} {'Taux':<10} {'Barre'}\n" + "─" * 70)
    for field_name, check_func in fields_to_check:
        count = sum(1 for b in bands if check_func(b))
        pct = (count / total * 100) if total > 0 else 0
        print(f"   {field_name:<20} {count:>8,}     {pct:>6.1f}%   {'█' * int(pct / 5)}{'░' * (20 - int(pct / 5))}")
    listeners_list = [b.get('listeners', 0) or 0 for b in bands if b.get('listeners')]
    if listeners_list:
        print(f"\n👂 Listeners :\n   Min      : {min(listeners_list):>12,}\n   Max      : {max(listeners_list):>12,}\n   Moyenne  : {sum(listeners_list) // len(listeners_list):>12,}")
    print("\n" + "=" * 80)

def print_album_statistics(bands: List[Dict]):
    all_albums = [album.copy() for band in bands for album in band.get('albums', [])]
    if not all_albums:
        return
    total = len(all_albums)
    print("\n" + "=" * 80 + f"\n💿 STATISTIQUES DÉTAILLÉES DES ALBUMS RÉCUPÉRÉS ({total:,} albums)\n" + "=" * 80)
    fields_to_check = [
        ('title', lambda a: bool(a.get('name') or a.get('title'))), ('artist', lambda a: bool(a.get('artist'))),
        ('year', lambda a: a.get('year') is not None), ('image_url', lambda a: bool(a.get('image') or a.get('cover_image'))),
        ('mbid', lambda a: bool(a.get('mbid'))), ('url', lambda a: bool(a.get('url'))),
        ('playcount', lambda a: a.get('playcount') is not None and _safe_int(a.get('playcount'), 0) > 0),
        ('release_type', lambda a: bool(a.get('type') or a.get('release_type'))), ('uri', lambda a: bool(a.get('uri'))),
        ('tracks', lambda a: bool(a.get('tracks')))
    ]
    print(f"\n{'Champ':<20} {'Remplis':<12} {'Taux':<10} {'Barre'}\n" + "─" * 70)
    for field_name, check_func in fields_to_check:
        count = sum(1 for a in all_albums if check_func(a))
        pct = (count / total * 100) if total > 0 else 0
        print(f"   {field_name:<20} {count:>8,}     {pct:>6.1f}%   {'█' * int(pct / 5)}{'░' * (20 - int(pct / 5))}")
    print("\n" + "=" * 80)

# ═══════════════════════════════════════════════════════════
# GESTION DE LA PROGRESSION ET MISE À JOUR
# ═══════════════════════════════════════════════════════════
def load_progress(path: str) -> Dict:
    if not Path(path).exists():
        return {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 1}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        data['last_page'] = max(1, data.get('last_page', 1))
        return data
    except:
        return {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 1}

def save_progress(path: str, progress: Dict):
    try:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(progress, f, ensure_ascii=False)
    except Exception as e:
        logger.error(f"❌ Erreur sauvegarde progression: {e}")

def reset_progress(path: str):
    if Path(path).exists():
        Path(path).unlink()

# ═══════════════════════════════════════════════════════════
# MISE À JOUR DES DONNÉES EXISTANTES
# ═══════════════════════════════════════════════════════════
def update_bands_from_file(file_path: str, fields: Optional[List[str]] = None, insecure: bool = False, proxy: Optional[str] = None, use_musicbrainz: bool = True, use_discogs: bool = True, max_albums_per_band: int = 5, preloaded_bands: Optional[List[Dict]] = None, include_tracks: bool = False, filter_album_type: Optional[List[str]] = None, force: bool = False, max_albums: int = DEFAULT_MAX_ALBUMS) -> Tuple[List[Dict], Dict]:
    bands = preloaded_bands if preloaded_bands is not None else (json.load(open(file_path, 'r', encoding='utf-8')) if isinstance(json.load(open(file_path, 'r', encoding='utf-8')), list) else json.load(open(file_path, 'r', encoding='utf-8')).get('bands', []))
    update_fields = set(field.strip() for field in fields) if fields else {'country', 'formed', 'formed_date', 'status', 'disbanded_date', 'rating', 'rating_votes', 'albums', 'members', 'mbid', 'album_mbid', 'image_url', 'original_name', 'biography', 'bio_lang', 'discogs_id', 'discogs_uri'}
    musicbrainz_fields = {'country', 'formed', 'formed_date', 'status', 'disbanded_date', 'rating', 'rating_votes'}
    if not use_musicbrainz:
        update_fields = update_fields - musicbrainz_fields - {'mbid', 'album_mbid', 'image_url'}
    if not update_fields:
        return bands, {'total_groups': len(bands), 'groups_updated': 0, 'fields': {}, 'total_albums_added': 0, 'total_members_added': 0, 'total_albums_mbid_added': 0}
    lastfm_client = LastFmClient(LASTFM_API_KEY, insecure=insecure, proxy=proxy)
    musicbrainz_client = MusicBrainzClient(mb_delay=DEFAULT_MB_DELAY, use_cache=True, proxy=proxy) if use_musicbrainz else None
    discogs_client = DiscogsClient(token=DISCOGS_TOKEN, use_cache=True, proxy=proxy) if use_discogs else None
    coverart_client = CoverArtArchiveClient(use_cache=True, proxy=proxy)
    stats = {'total_groups': len(bands), 'groups_updated': 0, 'fields': {field: 0 for field in update_fields}, 'total_albums_added': 0, 'total_members_added': 0, 'total_albums_mbid_added': 0}
    updated_bands = []
    for band in tqdm(bands, desc="Mise à jour"):
        name, mbid, changed = band.get('name'), band.get('mbid'), False
        missing = []
        if 'mbid' in update_fields and not band.get('mbid'): missing.append('mbid')
        if 'image_url' in update_fields and (force or not band.get('image_url') or is_placeholder(band.get('image_url'))): missing.append('image_url')
        if 'biography' in update_fields and not band.get('biography'): missing.append('biography')
        if 'bio_lang' in update_fields and not band.get('bio_lang'): missing.append('bio_lang')
        if 'original_name' in update_fields and not band.get('original_name'): missing.append('original_name')
        if 'discogs_id' in update_fields and not band.get('discogs_id'): missing.append('discogs_id')
        if 'discogs_uri' in update_fields and not band.get('discogs_uri'): missing.append('discogs_uri')
        if 'album_mbid' in update_fields and any(not a.get('mbid') and (a.get('name') or a.get('title')) for a in band.get('albums', [])): missing.append('album_mbid')
        if 'country' in update_fields and (not band.get('country') or band.get('country') == 'Unknown'): missing.append('country')
        if 'formed' in update_fields and band.get('formed') is None: missing.append('formed')
        if 'formed_date' in update_fields and band.get('formed_date') is None: missing.append('formed_date')
        if 'status' in update_fields and band.get('status') is None: missing.append('status')
        if 'disbanded_date' in update_fields and band.get('disbanded_date') is None: missing.append('disbanded_date')
        if 'rating' in update_fields and band.get('rating') is None: missing.append('rating')
        if 'rating_votes' in update_fields and band.get('rating_votes') is None: missing.append('rating_votes')
        if 'albums' in update_fields and (not band.get('albums') or len(band.get('albums', [])) == 0): missing.append('albums')
        if 'members' in update_fields and (not band.get('members') or len(band.get('members', [])) == 0): missing.append('members')
        if not missing:
            updated_bands.append(band)
            continue
        if 'mbid' in missing and name and musicbrainz_client:
            found = musicbrainz_client.search_artist_mbid(name)
            if found:
                band['mbid'], mbid, changed = found, found, True
                stats['fields']['mbid'] += 1
        if ('image_url' in missing or 'biography' in missing or 'bio_lang' in missing) and name:
            artist_info = lastfm_client.get_artist_info(name)
            if ('biography' in missing or 'bio_lang' in missing) and artist_info:
                bio = clean_biography(artist_info.get('bio', {}).get('content', ''))
                if bio and len(bio) >= MIN_BIO_LENGTH:
                    band['biography'], band['bio_lang'] = bio, artist_info.get('bio', {}).get('lang', 'en')
                    stats['fields']['biography'] += 1
                    stats['fields']['bio_lang'] += 1
                    changed = True
                    logger.info(f"📝 Biographie trouvée pour '{name}'")
            if 'image_url' in missing:
                img_url, img_src = None, None
                if artist_info:
                    img_url = pick_best_lastfm_image(artist_info.get('image', []))
                    if img_url: img_src = 'lastfm:artist.getInfo'
                if not img_url and use_discogs and discogs_client:
                    d_data = discogs_client.enrich_artist(name)
                    if d_data and d_data.get('image_url'):
                        img_url, img_src = d_data['image_url'], d_data['image_source']
                if not img_url and use_musicbrainz and musicbrainz_client and mbid:
                    mb_img = musicbrainz_client.get_artist_image(mbid)
                    if mb_img:
                        img_url, img_src = mb_img, 'musicbrainz+wikimedia-commons'
                if img_url and not is_placeholder(img_url):
                    band['image_url'], band['image_source'] = img_url, img_src
                    stats['fields']['image_url'] += 1
                    changed = True
                    logger.info(f"🖼️  Image trouvée pour '{name}' (Source: {img_src})")
        if ('discogs_id' in missing or 'discogs_uri' in missing) and use_discogs and discogs_client and name:
            d_data = discogs_client.enrich_artist(name)
            if d_data:
                if 'discogs_id' in missing and d_data.get('discogs_id'):
                    band['discogs_id'] = d_data['discogs_id']
                    stats['fields']['discogs_id'] += 1
                    changed = True
                if 'discogs_uri' in missing and d_data.get('discogs_uri'):
                    band['discogs_uri'] = d_data['discogs_uri']
                    stats['fields']['discogs_uri'] += 1
                    changed = True
        if 'original_name' in missing and name:
            match = re.match(r'^(.+?)\s*\(([^)]+)\)\s*$', name)
            if match:
                pot_name, country_in_parens = match.group(1).strip(), match.group(2).strip()
                if country_in_parens.lower() in {c.lower() for c in list(ISO_TO_COUNTRY.values()) + ['Unknown']}:
                    band['original_name'] = pot_name
                    stats['fields']['original_name'] += 1
                    changed = True
        if 'album_mbid' in missing and musicbrainz_client:
            albums_to_process = [a for a in band.get('albums', []) if not a.get('mbid') and (a.get('name') or a.get('title'))]
            if filter_album_type:
                albums_to_process = [a for a in albums_to_process if a.get('type', '').lower() in [t.lower() for t in filter_album_type]]
            albums_to_process = albums_to_process[:max_albums_per_band]
            enriched = 0
            for album in albums_to_process:
                found = musicbrainz_client.search_release_group_mbid(album.get('name') or album.get('title'), album.get('artist') or name)
                if found:
                    album['mbid'] = found
                    enriched += 1
            if enriched > 0:
                stats['fields']['album_mbid'] += enriched
                stats['total_albums_mbid_added'] += enriched
                changed = True
                logger.info(f"🎵 {enriched}/{len(albums_to_process)} albums enrichis avec MBID pour '{name}'")
        if musicbrainz_client and any(f in missing for f in musicbrainz_fields) and mbid:
            mb_country, mb_formed, mb_ended, mb_end_date, mb_formed_date, mb_genres, mb_rating, mb_rating_votes = musicbrainz_client.extract_country_formed_genres_ratings(mbid)
            for field, val, src in [('country', mb_country, 'musicbrainz'), ('formed', mb_formed, 'musicbrainz'), ('formed_date', mb_formed_date, 'musicbrainz'), ('status', 'Split up' if mb_ended else 'Active', None), ('disbanded_date', mb_end_date, None), ('rating', mb_rating, None), ('rating_votes', mb_rating_votes, None)]:
                if field in missing and val is not None and (field not in ['country'] or (not band.get('country') or band['country'] == 'Unknown')):
                    band[field] = val
                    if src: band[f'{field}_source'] = src
                    stats['fields'][field] += 1
                    changed = True
        if 'members' in missing and musicbrainz_client and mbid:
            mb_members = musicbrainz_client.extract_members(mbid)
            if mb_members:
                band['members'] = mb_members
                stats['fields']['members'] += 1
                stats['total_members_added'] += len(mb_members)
                changed = True
                logger.info(f"👥 {len(mb_members)} membres trouvés via MusicBrainz pour '{name}'")
        elif 'members' in missing and use_discogs and discogs_client and name and (not band.get('members') or len(band.get('members', [])) == 0):
            d_data = discogs_client.enrich_artist(name)
            if d_data and d_data.get('members'):
                band['members'] = d_data['members']
                stats['fields']['members'] += 1
                stats['total_members_added'] += len(d_data['members'])
                changed = True
                logger.info(f"👥 {len(d_data['members'])} membres trouvés via Discogs pour '{name}'")
        if 'albums' in missing and name:
            lastfm_albums = lastfm_client.get_artist_albums(name, limit=100, max_albums=max_albums)
            if lastfm_albums and (not band.get('albums') or len(band.get('albums', [])) == 0):
                if discogs_client:
                    lastfm_albums = discogs_client.enrich_albums_with_discogs(name, band.get('genre', 'Heavy Metal'), lastfm_albums, musicbrainz_client=musicbrainz_client, include_tracks=include_tracks)
                band['albums'], band['albums_source'] = lastfm_albums, 'lastfm'
                stats['fields']['albums'] += 1
                stats['total_albums_added'] += len(lastfm_albums)
                changed = True
        if band.get('albums') and coverart_client:
            for album in band['albums'][:max_albums_per_band]:
                if not album.get('image') and not album.get('cover_image') and album.get('mbid'):
                    cover_url = coverart_client.get_cover_for_album(album['mbid'])
                    if cover_url:
                        album['image'], album['image_source'] = cover_url, 'coverartarchive'
        if changed:
            stats['groups_updated'] += 1
            updated_bands.append(band)
    lastfm_client.save_cache()
    if musicbrainz_client: musicbrainz_client.save_cache()
    if discogs_client: discogs_client.save_cache()
    coverart_client.save_cache()
    return updated_bands, stats

# ═══════════════════════════════════════════════════════════
# TRAITEMENT ET RÉCUPÉRATION PRINCIPALE
# ═══════════════════════════════════════════════════════════
def process_artist(artist_data: Dict, source_tag: str, bio_lang: str, lastfm_client: Optional[LastFmClient] = None, musicbrainz_client: Optional[MusicBrainzClient] = None, discogs_client: Optional[DiscogsClient] = None, coverart_client: Optional[CoverArtArchiveClient] = None, focus_albums: bool = False, include_tracks: bool = False, max_albums: int = DEFAULT_MAX_ALBUMS) -> Optional[Dict]:
    name = artist_data.get('name', '').strip()
    if not name: return None
    genre, genre_source = extract_genre_from_tags(artist_data.get('tags', {}).get('tag', [])) or 'Metal', 'lastfm_tags'
    if focus_albums:
        albums, albums_source = [], None
        if lastfm_client:
            albums = lastfm_client.get_artist_albums(name, limit=100, max_pages=2, max_albums=max_albums)
            if albums: albums_source = 'lastfm'
        if discogs_client and albums and albums_source == 'lastfm':
            albums = discogs_client.enrich_albums_with_discogs(name, genre, albums, musicbrainz_client=musicbrainz_client, include_tracks=include_tracks)
        return {
            'name': name, 'genre': genre, 'genre_source': genre_source, 'country': 'Unknown', 'country_source': 'unknown',
            'formed': None, 'formed_date': None, 'formed_source': 'unknown', 'status': 'Unknown', 'disbanded_date': None,
            'rating': None, 'rating_votes': None, 'mbid': artist_data.get('mbid', '').strip() or None, 'biography': None,
            'bio_lang': 'none', 'image_url': None, 'image_source': None, 'listeners': int(artist_data.get('stats', {}).get('listeners', 0) or 0),
            'albums': albums, 'albums_source': albums_source, 'members': [], 'source_tag': source_tag, 'fetched_at': datetime.now(timezone.utc).isoformat()
        }
    biography = clean_biography(artist_data.get('bio', {}).get('content', ''))
    images = artist_data.get('image', [])
    image_url = pick_best_lastfm_image(images)
    image_source = 'lastfm:artist.getInfo' if image_url else None
    if not image_url and lastfm_client: lastfm_client.image_stats['placeholder_filtered'] += 1
    listeners = int(artist_data.get('stats', {}).get('listeners', 0) or 0)
    country, country_source, formed, formed_source, formed_date, status, disbanded_date, rating, rating_votes, mbid, albums, albums_source = None, None, None, None, None, 'Active', None, None, None, artist_data.get('mbid', '').strip(), [], None
    if lastfm_client and name:
        albums = lastfm_client.get_artist_albums(name, limit=100, max_pages=3, max_albums=max_albums)
        if albums: albums_source = 'lastfm'
    mb_members = []
    if musicbrainz_client and mbid:
        mb_country, mb_formed, mb_ended, mb_end_date, mb_formed_date, mb_genres, mb_rating, mb_rating_votes = musicbrainz_client.extract_country_formed_genres_ratings(mbid)
        if mb_country: country, country_source = mb_country, 'musicbrainz'
        if mb_formed: formed, formed_source = mb_formed, 'musicbrainz'
        if mb_ended is not None: status = 'Split up' if mb_ended else 'Active'
        disbanded_date, formed_date, rating, rating_votes = mb_end_date, mb_formed_date, mb_rating, mb_rating_votes
        if mb_genres: genre, genre_source = mb_genres[0]['name'].title(), 'musicbrainz'
        mb_members = musicbrainz_client.extract_members(mbid)
    discogs_data = None
    if discogs_client and name:
        cache_key = name.lower().strip()
        discogs_data = discogs_client.cache.get(cache_key) if discogs_client.cache else None
        if not discogs_data:
            discogs_data = discogs_client.enrich_artist(name)
        if discogs_client.cache: discogs_client.cache.set(cache_key, discogs_data)
        if not albums and discogs_data and discogs_data.get('albums'):
            albums, albums_source = discogs_data['albums'], 'discogs'
    all_members = mb_members if musicbrainz_client and mbid and mb_members else []
    if not all_members and discogs_client and discogs_data and discogs_data.get('members'):
        all_members = discogs_data['members']
    if not country:
        tag_country = extract_country_from_tags(artist_data.get('tags', {}).get('tag', []))
        if tag_country: country, country_source = tag_country, 'lastfm_tags'
        else: country, country_source = 'Unknown', 'unknown'
    if not formed_source: formed_source = 'unknown'
    result = {
        'name': name, 'genre': genre, 'genre_source': genre_source, 'country': country, 'country_source': country_source,
        'formed': formed, 'formed_date': formed_date, 'formed_source': formed_source, 'status': status, 'disbanded_date': disbanded_date,
        'rating': rating, 'rating_votes': rating_votes, 'mbid': mbid or None, 'biography': biography or None, 'bio_lang': bio_lang,
        'image_url': image_url, 'image_source': image_source, 'listeners': listeners, 'albums': albums, 'albums_source': albums_source,
        'members': all_members, 'source_tag': source_tag, 'fetched_at': datetime.now(timezone.utc).isoformat()
    }
    if discogs_data:
        result['discogs_id'] = discogs_data.get('discogs_id')
        result['discogs_uri'] = discogs_data.get('discogs_uri')
    if not image_url and lastfm_client: lastfm_client.image_stats['no_image'] += 1
    return result

# ═══════════════════════════════════════════════════════════
# ✨ FONCTION PRINCIPALE AVEC BARRE DE PROGRESSION GLOBALE
# ═══════════════════════════════════════════════════════════
def fetch_all_metal_bands(limit: int, resume: bool, progress_path: str, preferred_lang: str, use_musicbrainz: bool, mb_delay: float, use_discogs: bool, min_listeners: int = 0, insecure: bool = False, proxy: Optional[str] = None, focus_albums: bool = False, include_tracks: bool = False, pillar_filter: Optional[str] = None, max_albums: int = DEFAULT_MAX_ALBUMS):
    if not LASTFM_API_KEY:
        logger.error("❌ Erreur: LASTFM_API_KEY non définie dans .env")
        return [], {}, {}, {}, {}, {}
    
    logger.info(f"🎸 Démarrage de la récupération des groupes metal (Limite: {limit}, Langue: {preferred_lang.upper()}, Max albums/artiste: {max_albums})")
    logger.info(f"⚡ SOLUTION A activée : max {max_albums * RAW_ALBUMS_MULTIPLIER} albums bruts traités par artiste (fallback album.getInfo désactivé)")
    if min_listeners > 0: logger.info(f"🔍 Filtre listeners: minimum {min_listeners:,} (appliqué en post-collecte)")
    if focus_albums: logger.info("⚡ MODE FOCUS-ALBUMS activé")
    if include_tracks: logger.warning("⚠️  MODE INCLUDE-TRACKS ACTIVÉ")
    logger.info(f"🎨 Filtrage des genres : {len(ALLOWED_METAL_GENRES)} genres metal autorisés")
    
    lastfm_client = LastFmClient(LASTFM_API_KEY, default_lang=preferred_lang, insecure=insecure, proxy=proxy)
    musicbrainz_client = MusicBrainzClient(mb_delay=mb_delay, use_cache=use_musicbrainz, proxy=proxy) if use_musicbrainz else None
    discogs_client = DiscogsClient(token=DISCOGS_TOKEN, use_cache=use_discogs, proxy=proxy) if use_discogs else None
    coverart_client = CoverArtArchiveClient(use_cache=True, proxy=proxy)
    
    if resume:
        progress = load_progress(progress_path)
        seen_names, bands_list, start_tag_idx, start_page = set(progress.get('seen_names', [])), progress.get('bands', []), progress.get('last_tag_index', 0), progress.get('last_page', 1)
        logger.info(f"🔄 Reprise depuis le tag {start_tag_idx}, page {start_page} — {len(bands_list)} groupes déjà en cache")
    else:
        progress, seen_names, bands_list, start_tag_idx, start_page = {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 1}, set(), [], 0, 1
    
    tags_to_fetch = METAL_TAGS
    if pillar_filter:
        tags_to_fetch = [t for t in METAL_TAGS if resolve_pillar(t) == pillar_filter]
        logger.info(f"🎯 Pilier ciblé : {pillar_filter}")
        logger.info(f"   Tags Last.fm utilisés : {', '.join(tags_to_fetch)}")
        if not tags_to_fetch:
            logger.warning(f"⚠️  Aucun tag Last.fm ne correspond au pilier '{pillar_filter}'")
            return [], {}, {}, {}, {}, {}
    logger.info(f"📊 {len(tags_to_fetch)} sous-genres à parcourir")
    if use_musicbrainz and not focus_albums: logger.info(f"🎵 MusicBrainz: ACTIVÉ (délai: {mb_delay}s)")
    else: logger.info("⏭️  MusicBrainz: DÉSACTIVÉ")
    if use_discogs: logger.info(f"💿 Discogs: ACTIVÉ ({'AVEC' if DISCOGS_TOKEN else 'SANS'} token)")
    else: logger.info("⏭️  Discogs: DÉSACTIVÉ")
    
    # ✨ NOUVELLE BARRE DE PROGRESSION GLOBALE basée sur la limite de groupes
    progress_bar = tqdm(
        total=limit,
        initial=len(bands_list),
        desc="🎸 Groupes",
        unit="band",
        bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}] {postfix}",
        dynamic_ncols=True,
    )
    
    # ✨ Stats de suivi en temps réel
    stats_live = {
        'artists_seen': 0,
        'artists_skipped_duplicate': 0,
        'artists_processed': 0,
    }
    
    start_time = time.time()
    last_stats_log = len(bands_list)
    interrupted = False
    
    try:
        for tag_idx, tag in enumerate(tags_to_fetch[start_tag_idx:], start=start_tag_idx):
            page = start_page if tag_idx == 0 else 1
            progress_bar.set_postfix_str(f"Genre: {tag} (p.{page})")
            
            while len(bands_list) < limit:
                artists = lastfm_client.get_top_artists_by_tag(tag, limit=100, page=page)
                if not artists:
                    break
                
                for artist in artists:
                    if len(bands_list) >= limit:
                        break
                    
                    stats_live['artists_seen'] += 1
                    artist_name = artist.get('name', '').strip()
                    
                    if not artist_name or artist_name in seen_names:
                        stats_live['artists_skipped_duplicate'] += 1
                        continue
                    seen_names.add(artist_name)
                    
                    artist_info, actual_lang = lastfm_client.get_artist_info_with_fallback(artist_name, preferred_lang, 'en')
                    if artist_info:
                        lastfm_client.bio_stats[f'bio_{preferred_lang}' if actual_lang == preferred_lang else ('bio_en' if actual_lang == 'en' else 'bio_none')] += 1
                    
                    processed = process_artist(artist_info, tag, actual_lang, lastfm_client, musicbrainz_client, discogs_client, coverart_client, focus_albums, include_tracks, max_albums)
                    if processed:
                        bands_list.append(processed)
                        stats_live['artists_processed'] += 1
                        
                        # ✨ Mise à jour de la barre de progression
                        progress_bar.update(1)
                        
                        # ✨ Log détaillé toutes les PROGRESS_LOG_INTERVAL groupes
                        if len(bands_list) - last_stats_log >= PROGRESS_LOG_INTERVAL:
                            elapsed = time.time() - start_time
                            rate = len(bands_list) / elapsed if elapsed > 0 else 0
                            remaining = (limit - len(bands_list)) / rate if rate > 0 else 0
                            albums_total = lastfm_client.album_stats.get('total_albums_fetched', 0)
                            albums_mbid = lastfm_client.album_stats.get('albums_with_valid_mbid', 0)
                            albums_rejected = lastfm_client.album_stats.get('albums_rejected_no_mbid', 0)
                            mbid_pct = (albums_mbid / albums_total * 100) if albums_total > 0 else 0
                            logger.info(
                                f"📊 [{len(bands_list)}/{limit}] "
                                f"{rate:.2f} band/s | "
                                f"ETA: {remaining/60:.1f}min | "
                                f"Artistes vus: {stats_live['artists_seen']} | "
                                f"Doublons: {stats_live['artists_skipped_duplicate']} | "
                                f"Albums MBID: {albums_mbid}/{albums_total} ({mbid_pct:.1f}%) "
                                f"(rejetés: {albums_rejected})"
                            )
                            last_stats_log = len(bands_list)
                        
                        progress['seen_names'] = list(seen_names)
                        progress['bands'] = bands_list
                        progress['last_tag_index'] = tag_idx
                        progress['last_page'] = page
                        save_progress(progress_path, progress)
                
                page += 1
                progress_bar.set_postfix_str(f"Genre: {tag} (p.{page})")
                
                if len(bands_list) >= limit:
                    break
            
            if len(bands_list) >= limit:
                break
        
        progress_bar.set_postfix_str("✅ Terminé !")
    except KeyboardInterrupt:
        interrupted = True
        progress_bar.set_postfix_str("⚠️ Interrompu")
        logger.warning(f"\n⚠️  Interruption par l'utilisateur — {len(bands_list)} groupes sauvegardés dans le cache")
        logger.warning("💡 Relancez avec --resume pour continuer")
    finally:
        progress_bar.close()
    
    # ✨ Filtrage post-collecte par listeners
    if min_listeners > 0 and bands_list:
        before_count = len(bands_list)
        bands_list, filter_stats = filter_bands_by_listeners(bands_list, min_listeners)
        logger.info(f"🔍 Filtrage listeners : {before_count:,} -> {len(bands_list):,} (supprimés: {filter_stats['removed']:,})")
    
    lastfm_client.save_cache()
    if musicbrainz_client: musicbrainz_client.save_cache()
    if discogs_client: discogs_client.save_cache()
    coverart_client.save_cache()
    
    # ✨ RAPPORT FINAL CONSOLIDÉ
    total_elapsed = time.time() - start_time
    albums_total = lastfm_client.album_stats.get('total_albums_fetched', 0)
    albums_mbid = lastfm_client.album_stats.get('albums_with_valid_mbid', 0)
    albums_rejected = lastfm_client.album_stats.get('albums_rejected_no_mbid', 0)
    mbid_pct = (albums_mbid / albums_total * 100) if albums_total > 0 else 0
    
    logger.info(f"\n✅ Récupération {'interrompue' if interrupted else 'terminée'}: {len(bands_list)} groupes")
    logger.info(
        f"\n{'='*80}\n"
        f"📈 RAPPORT FINAL DE COLLECTE\n"
        f"{'='*80}\n"
        f"   Durée totale           : {total_elapsed/60:.1f} minutes\n"
        f"   Groupes récupérés      : {len(bands_list):,}\n"
        f"   Artistes examinés      : {stats_live['artists_seen']:,}\n"
        f"   Artistes doublons      : {stats_live['artists_skipped_duplicate']:,}\n"
        f"   Albums Last.fm         : {albums_total:,}\n"
        f"   Albums avec MBID       : {albums_mbid:,} ({mbid_pct:.1f}%)\n"
        f"   Albums rejetés (MBID)  : {albums_rejected:,}\n"
        f"{'='*80}"
    )
    
    if musicbrainz_client:
        logger.info(f"📊 MB: Pays (direct: {musicbrainz_client.country_stats.get('resolved_direct', 0):,}, hiérarchie: {musicbrainz_client.country_stats.get('resolved_hierarchy', 0):,}, échecs: {musicbrainz_client.country_stats.get('unresolved', 0):,}) | Genres filtrés: {musicbrainz_client.genre_stats.get('filtered_genres', 0):,}/{musicbrainz_client.genre_stats.get('total_raw_genres', 0):,}")
    if discogs_client:
        total, enriched = discogs_client.album_enrichment_stats.get('total', 0), discogs_client.album_enrichment_stats.get('enriched', 0)
        logger.info(f"💿 Discogs: Albums enrichis: {enriched:,}/{total:,} ({(enriched/total*100) if total > 0 else 0:.1f}%)")
    
    if not interrupted:
        print_artist_statistics(bands_list)
        print_album_statistics(bands_list)
    
    return bands_list, lastfm_client.stats, musicbrainz_client.stats if musicbrainz_client else {}, discogs_client.stats if discogs_client else {}, lastfm_client.album_stats, coverart_client.stats

# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description='Récupère des groupes metal via Last.fm + MusicBrainz + Discogs', formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT)
    parser.add_argument('--lang', type=str, default=DEFAULT_LANG, choices=['fr', 'en'])
    parser.add_argument('--mb-delay', type=float, default=DEFAULT_MB_DELAY)
    parser.add_argument('--skip-musicbrainz', action='store_true')
    parser.add_argument('--with-discogs', action='store_true')
    parser.add_argument('--insecure', action='store_true')
    parser.add_argument('--test', action='store_true')
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--reset', action='store_true')
    parser.add_argument('--clear-mb-cache', action='store_true')
    parser.add_argument('--clear-discogs-cache', action='store_true')
    parser.add_argument('--clear-lastfm-cache', action='store_true')
    parser.add_argument('--clear-caa-cache', action='store_true')
    parser.add_argument('--clear-albums-cache', action='store_true')
    parser.add_argument('--clear-tracklist-cache', action='store_true', help='Vide le cache des tracklists Discogs')
    parser.add_argument('--log-level', type=str, default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    parser.add_argument('--no-log-file', action='store_true')
    parser.add_argument('--output', type=str, default=None)
    parser.add_argument('--proxy', type=str, default=None)
    parser.add_argument('--update-from', type=str, default=None)
    parser.add_argument('--update-fields', type=str, default=None)
    parser.add_argument('--max-albums-per-band', type=int, default=5)
    parser.add_argument('--filter-album-type', type=str, default=None, help='Types d\'albums à garder (ex: "master,album")')
    parser.add_argument('--min-listeners', type=int, default=0, help='Nombre minimum de listeners Last.fm')
    parser.add_argument('--focus-albums', action='store_true', help='Mode optimisé : skip bio, membres, détails MB')
    parser.add_argument('--include-tracks', action='store_true', help='Récupère la tracklist via Discogs')
    parser.add_argument('--force', action='store_true', help='Force la récupération même si les données existent')
    parser.add_argument('--enrich-years', action='store_true', help='Enrichit les années manquantes des albums (MusicBrainz + Discogs URI)')
    parser.add_argument('--pillar', type=str, default=None, choices=sorted(METAL_PILLARS), help='Filtre les groupes par pilier (ex: "Folk Metal")')
    parser.add_argument('--max-albums', type=int, default=DEFAULT_MAX_ALBUMS, help=f'Nombre maximum d\'albums à récupérer par artiste (défaut: {DEFAULT_MAX_ALBUMS})')
    args = parser.parse_args()
    
    setup_logging(args.log_level, None if args.no_log_file else LOG_FILE)
    logger.info("=" * 80 + "\n🚀 METAL FETCHER - Démarrage\n" + "=" * 80)
    
    proxy = args.proxy or os.getenv('HTTP_PROXY') or os.getenv('HTTPS_PROXY')
    if proxy: logger.info(f"🌐 Proxy utilisé: {proxy}")
    
    if args.test:
        sys.exit(0 if test_services(insecure=args.insecure, proxy=proxy) else 1)
        
    if args.reset: reset_progress(PROGRESS_FILE)
    if args.clear_mb_cache: Path(MB_CACHE_FILE).unlink(missing_ok=True); logger.info("🗑️  Cache MusicBrainz vidé")
    if args.clear_discogs_cache: Path(DISCOGS_CACHE_FILE).unlink(missing_ok=True); logger.info("🗑️  Cache Discogs vidé")
    if args.clear_lastfm_cache: Path(LASTFM_CACHE_FILE).unlink(missing_ok=True); logger.info("🗑️  Cache Last.fm vidé")
    if args.clear_caa_cache: Path(CAA_CACHE_FILE).unlink(missing_ok=True); logger.info("🗑️  Cache Cover Art Archive vidé")
    if args.clear_tracklist_cache: Path(TRACKLIST_CACHE_FILE).unlink(missing_ok=True); logger.info("🗑️  Cache des tracklists vidé")
    if args.clear_albums_cache:
        for cache_file in [LASTFM_CACHE_FILE, DISCOGS_CACHE_FILE]:
            if cache_file and Path(cache_file).exists():
                try:
                    cache = json.load(open(cache_file, 'r', encoding='utf-8'))
                    original_size = len(cache)
                    cache = {k: v for k, v in cache.items() if not k.startswith('albums:') and not k.startswith('discogs_releases:')}
                    with open(cache_file, 'w', encoding='utf-8') as f:
                        json.dump(cache, f, ensure_ascii=False)
                    logger.info(f"🗑️  Cache albums vidé: {original_size - len(cache)} entrées supprimées")
                except Exception as e:
                    logger.error(f"❌ Erreur vidage cache albums: {e}")
                    
    if args.enrich_years:
        logger.info("📅 Mode enrichissement des années d'albums activé (MusicBrainz + Discogs URI)")
        input_file = args.update_from or '../data/metal_bands_updated_latest.json'
        if not Path(input_file).exists():
            logger.error(f"❌ Fichier introuvable : {input_file}")
            sys.exit(1)
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        bands = data.get('bands', data) if isinstance(data, dict) else data
        if args.pillar:
            bands, filter_stats = filter_bands_by_pillar(bands, args.pillar)
            logger.info(f"🎯 Pilier '{args.pillar}' : {filter_stats['total_after']}/{filter_stats['total_before']} groupes retenus")
            if not bands:
                logger.warning("⚠️  Aucun groupe ne correspond à ce pilier")
                sys.exit(0)
        discogs_client = DiscogsClient(token=DISCOGS_TOKEN, use_cache=True, proxy=proxy)
        musicbrainz_client = MusicBrainzClient(mb_delay=DEFAULT_MB_DELAY, use_cache=True, proxy=proxy)
        total_albums, albums_with_year, albums_enriched = 0, 0, 0
        for band in tqdm(bands, desc="Enrichissement années"):
            band_name = band.get('name', '')
            for album in band.get('albums', []):
                total_albums += 1
                if album.get('year'):
                    albums_with_year += 1
                    continue
                year = discogs_client.enrich_album_year(album, band_name, musicbrainz_client=musicbrainz_client)
                if year:
                    album['year'] = year
                    albums_enriched += 1
                    albums_with_year += 1
        discogs_client.save_cache()
        musicbrainz_client.save_cache()
        pct = (albums_with_year / total_albums * 100) if total_albums > 0 else 0
        logger.info(f"\n📊 Statistiques d'enrichissement des années :\n   Total albums : {total_albums:,}\n   Albums avec année : {albums_with_year:,} ({pct:.1f}%)\n   Albums enrichis : {albums_enriched:,}")
        output_path = generate_output_filename('metal_bands_years_enriched', '../data')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({'bands': bands}, f, ensure_ascii=False, indent=2)
        logger.info(f"✅ Fichier sauvegardé : {output_path}")
        sys.exit(0)
        
    if args.update_from:
        logger.info(f"🔄 Mise à jour du fichier {args.update_from}...")
        update_fields = args.update_fields.split(',') if args.update_fields else None
        with open(args.update_from, 'r', encoding='utf-8') as f:
            data = json.load(f)
        bands = data if isinstance(data, list) else data.get('bands', [])
        if not bands:
            logger.error("❌ Format de fichier inconnu ou vide")
            sys.exit(1)
        if args.pillar:
            before = len(bands)
            bands, filter_stats = filter_bands_by_pillar(bands, args.pillar)
            logger.info(f"🎯 Pilier '{args.pillar}' : {len(bands)}/{before} groupes retenus")
            if not bands:
                logger.warning("⚠️  Aucun groupe ne correspond à ce pilier")
                sys.exit(0)
        if args.min_listeners > 0:
            bands, filter_stats = filter_bands_by_listeners(bands, args.min_listeners)
            logger.info(f"🔍 Filtrage listeners : {filter_stats['total_before']:,} -> {filter_stats['total_after']:,}")
        try:
            album_type_filter = [t.strip() for t in args.filter_album_type.split(',')] if args.filter_album_type else None
            updated_bands, update_stats = update_bands_from_file(args.update_from, fields=update_fields, insecure=args.insecure, proxy=proxy, use_musicbrainz=not args.skip_musicbrainz, use_discogs=args.with_discogs, max_albums_per_band=args.max_albums_per_band, preloaded_bands=bands, include_tracks=args.include_tracks, filter_album_type=album_type_filter, force=args.force, max_albums=args.max_albums)
            if args.filter_album_type:
                updated_bands, filter_stats = filter_albums_by_type(updated_bands, album_type_filter, max_per_band=args.max_albums_per_band)
                logger.info(f"🔍 Filtrage albums : {filter_stats['total_albums_before']:,} -> {filter_stats['total_albums_after']:,} (supprimés: {filter_stats['albums_removed']:,})")
            output_path = Path(args.output) if args.output else generate_output_filename('metal_bands_updated', '../data')
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump({'bands': updated_bands}, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ Fichier mis à jour sauvegardé dans {output_path}")
            logger.info(f"   Groupes traités : {update_stats['total_groups']} | mis à jour : {update_stats['groups_updated']}")
            logger.info(f"   Albums ajoutés : {update_stats['total_albums_added']} | Membres ajoutés : {update_stats['total_members_added']}")
            logger.info(f"   MBID artistes : {update_stats['fields'].get('mbid', 0)} | MBID albums : {update_stats.get('total_albums_mbid_added', 0)}")
            logger.info(f"   Images : {update_stats['fields'].get('image_url', 0)} | Bios : {update_stats['fields'].get('biography', 0)}")
            logger.info(f"   Discogs IDs : {update_stats['fields'].get('discogs_id', 0)} | Discogs URIs : {update_stats['fields'].get('discogs_uri', 0)}")
            print_artist_statistics(updated_bands)
            print_album_statistics(updated_bands)
            sys.exit(0)
        except Exception as e:
            logger.error(f"❌ Erreur lors de la mise à jour: {e}", exc_info=True)
            sys.exit(1)
    
    try:
        bands, lastfm_stats, mb_stats, discogs_stats, album_stats, caa_stats = fetch_all_metal_bands(
            limit=args.limit, resume=args.resume, progress_path=PROGRESS_FILE, preferred_lang=args.lang,
            use_musicbrainz=not args.skip_musicbrainz, mb_delay=args.mb_delay, use_discogs=args.with_discogs,
            min_listeners=args.min_listeners, insecure=args.insecure, proxy=proxy, focus_albums=args.focus_albums,
            include_tracks=args.include_tracks, pillar_filter=args.pillar, max_albums=args.max_albums
        )
        if args.filter_album_type and bands:
            types_to_filter = [t.strip() for t in args.filter_album_type.split(',')]
            bands, filter_stats = filter_albums_by_type(bands, types_to_filter, max_per_band=args.max_albums_per_band)
            logger.info(f"🔍 Filtrage albums : {filter_stats['total_albums_before']:,} -> {filter_stats['total_albums_after']:,}")
        if bands:
            output_path = Path(args.output) if args.output else generate_output_filename('metal_bands', '../data')
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump({'bands': bands}, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ {len(bands)} groupes sauvegardés dans {output_path}")
        else:
            logger.warning("⚠️  Aucun groupe récupéré")
    except KeyboardInterrupt:
        logger.warning("⚠️  Interruption par l'utilisateur (Ctrl+C)\n💡 Utilisez --resume pour reprendre plus tard")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
