#!/usr/bin/env python3
"""
Récupère des groupes metal via Last.fm + MusicBrainz + Discogs.

Optimisations :
  - Logging complet avec niveaux (DEBUG, INFO, WARNING, ERROR)
  - Sauvegarde des logs dans metal_fetcher.log
  - Rate limiting adapté à chaque API
  - Cache local des données (pour toutes les API)
  - Pagination infinie Last.fm
  - Enrichissement Discogs optionnel (--with-discogs)
  - Fichier de sortie horodaté automatiquement + lien symbolique "latest"
  - Support proxy (--proxy ou variables d'environnement)
  - HTTPS par défaut pour Last.fm, option --insecure pour HTTP
  - Mode test (--test) pour vérifier connexion et authentification
  - Gestion explicite de tous les codes d'erreur pour toutes les API
  - Statistiques détaillées pour toutes les API (requêtes, rate limits, cache)
  - Mise à jour des données existantes (--update-from)
  - Respect de --skip-musicbrainz en mode --update-from
  - Correction du wait_time MusicBrainz (minimum 1s)

Usage:
  python fetch_metal_bands.py                        # 10 000 groupes (HTTPS)
  python fetch_metal_bands.py --limit 500            # 500 groupes
  python fetch_metal_bands.py --test                 # Teste la connexion aux API
  python fetch_metal_bands.py --insecure             # Force HTTP pour Last.fm
  python fetch_metal_bands.py --with-discogs         # Active Discogs
  python fetch_metal_bands.py --proxy http://proxy:8080  # Utilise un proxy
  python fetch_metal_bands.py --log-level DEBUG      # Logs détaillés
  python fetch_metal_bands.py --resume               # Reprendre après interruption
  python fetch_metal_bands.py --skip-musicbrainz     # Désactive MusicBrainz
  python fetch_metal_bands.py --update-from ../data/metal_bands_latest.json
  python fetch_metal_bands.py --update-from ../data/metal_bands_latest.json --update-fields country,albums,members

Configuration:
  - Clé API Last.fm OBLIGATOIRE (dans .env)
  - Token Discogs OPTIONNEL (dans .env) - 60 req/min avec, 25 req/min sans
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
from typing import Optional, Dict, List, Set, Tuple
from tqdm import tqdm
from dotenv import load_dotenv

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════

load_dotenv(Path(__file__).parent.parent / '.env')

LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')           # OBLIGATOIRE
DISCOGS_TOKEN = os.getenv('DISCOGS_TOKEN')             # OPTIONNEL (améliore les limites)

# HTTPS par défaut, option --insecure pour revenir en HTTP
LASTFM_API_URL_HTTP = 'http://ws.audioscrobbler.com/2.0/'
LASTFM_API_URL_HTTPS = 'https://ws.audioscrobbler.com/2.0/'

MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2/'
DISCOGS_API_URL = 'https://api.discogs.com/'

DEFAULT_OUTPUT = '../data/metal_bands.json'
DEFAULT_LIMIT = 10000
DEFAULT_LANG = 'fr'
MIN_BIO_LENGTH = 100

LASTFM_DELAY = 0.25
DEFAULT_MB_DELAY = 3.0
DISCOGS_DELAY = 1.1

MB_CACHE_FILE = '../data/mbid_cache.json'
DISCOGS_CACHE_FILE = '../data/discogs_cache.json'
LASTFM_CACHE_FILE = '../data/lastfm_cache.json'
PROGRESS_FILE = '../data/fetch_progress.json'
LOG_FILE = '../logs/metal_fetcher.log'

# ═══════════════════════════════════════════════════════════
# LOGGING SETUP
# ═══════════════════════════════════════════════════════════

def setup_logging(log_level: str = 'INFO', log_file: Optional[str] = LOG_FILE):
    """Configure le système de logging"""
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

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════

def generate_output_filename(base_name: str = 'metal_bands', output_dir: str = '../data') -> Path:
    """Génère un nom de fichier avec horodatage et crée un lien symbolique vers le dernier."""
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
            logger.info(f"📝 Fichier .latest créé: {latest_file} -> {filename}")
        except OSError:
            pass

    return filepath


# ═══════════════════════════════════════════════════════════
# DICTIONNAIRES DES CODES D'ERREUR
# ═══════════════════════════════════════════════════════════

# ─── Last.fm Error Codes ────────────────────────────────────
LASTFM_ERROR_CODES = {
    1: "Invalid service - Service inexistant",
    2: "Invalid method - Méthode API inexistante",
    3: "Invalid authentication token - Token d'authentification invalide",
    4: "Authentication failed - Échec de l'authentification",
    5: "Invalid API key - Clé API invalide",
    6: "Invalid session key - Clé de session invalide",
    7: "Invalid API key - Clé API invalide",
    8: "Operation failed - Opération échouée (erreur interne Last.fm)",
    9: "Invalid method - Méthode invalide",
    10: "❌ INVALID API KEY - Vérifiez votre LASTFM_API_KEY dans .env",
    11: "Service offline - Last.fm est temporairement hors ligne",
    12: "Invalid method signature - Signature de méthode invalide",
    13: "Invalid method signature - Signature de méthode invalide",
    14: "Invalid token - Token invalide",
    15: "Token expired - Token expiré, renouvelez-le",
    16: "Service temporarily unavailable - Service temporairement indisponible (réessayez plus tard)",
    17: "Login required - Authentification requise",
    18: "Invalid parameters - Paramètres invalides",
    19: "Invalid resource - Ressource invalide",
    20: "Invalid format - Format de réponse invalide",
    21: "Invalid action - Action invalide",
    22: "Invalid method signature - Signature de méthode invalide",
    23: "Invalid method signature - Signature de méthode invalide",
    24: "Invalid method signature - Signature de méthode invalide",
    25: "Invalid method signature - Signature de méthode invalide",
    26: "❌ API KEY SUSPENDED - Votre clé API a été suspendue par Last.fm (contactez le support)",
    27: "❌ API KEY EXPIRED - Votre clé API a expiré (générez-en une nouvelle)",
    28: "Service unavailable - Service indisponible",
    29: "⚠️  RATE LIMIT EXCEEDED - Trop de requêtes (ralentissez le rythme)",
    30: "Service currently unavailable - Service actuellement indisponible",
    31: "Invalid method signature - Signature de méthode invalide",
    32: "Invalid method signature - Signature de méthode invalide",
    33: "Invalid method signature - Signature de méthode invalide",
    34: "Invalid method signature - Signature de méthode invalide",
    35: "Invalid method signature - Signature de méthode invalide",
    36: "Invalid method signature - Signature de méthode invalide",
    37: "Invalid method signature - Signature de méthode invalide",
    38: "Invalid method signature - Signature de méthode invalide",
    39: "Invalid method signature - Signature de méthode invalide",
    40: "Invalid method signature - Signature de méthode invalide",
}

# Erreurs permanentes Last.fm (arrêt immédiat)
LASTFM_PERMANENT_ERRORS = {5, 10, 26, 27}

# Erreurs temporaires Last.fm (retry avec backoff)
LASTFM_TEMPORARY_ERRORS = {8, 11, 16, 28, 29, 30}

# ─── MusicBrainz Error Codes ───────────────────────────────
MUSICBRAINZ_HTTP_ERRORS = {
    400: "Bad Request - La requête est mal formée",
    401: "Unauthorized - Authentification requise",
    403: "Forbidden - Accès interdit (User-Agent invalide ou manquant)",
    404: "Not Found - La ressource demandée n'existe pas",
    405: "Method Not Allowed - Méthode HTTP non autorisée",
    406: "Not Acceptable - Format de réponse non accepté",
    408: "Request Timeout - La requête a expiré",
    413: "Payload Too Large - La requête est trop volumineuse",
    429: "Too Many Requests - Trop de requêtes (rate limit)",
    500: "Internal Server Error - Erreur interne MusicBrainz",
    502: "Bad Gateway - Erreur de passerelle MusicBrainz",
    503: "Service Unavailable - Service indisponible (rate limit ou maintenance)",
    504: "Gateway Timeout - Délai d'attente dépassé",
}

# Erreurs permanentes MusicBrainz (arrêt immédiat)
MUSICBRAINZ_PERMANENT_ERRORS = {400, 401, 403, 404, 405, 406}

# Erreurs temporaires MusicBrainz (retry avec backoff)
MUSICBRAINZ_TEMPORARY_ERRORS = {408, 413, 429, 500, 502, 503, 504}

# ─── Discogs Error Codes ────────────────────────────────────
DISCOGS_HTTP_ERRORS = {
    400: "Bad Request - La requête est mal formée (paramètres invalides)",
    401: "Unauthorized - Authentification requise (token invalide ou manquant)",
    403: "Forbidden - Accès interdit (permissions insuffisantes)",
    404: "Not Found - La ressource demandée n'existe pas",
    405: "Method Not Allowed - Méthode HTTP non autorisée",
    406: "Not Acceptable - Format de réponse non accepté",
    408: "Request Timeout - La requête a expiré",
    413: "Payload Too Large - La requête est trop volumineuse",
    415: "Unsupported Media Type - Type de média non supporté",
    422: "Unprocessable Entity - Requête mal formée (JSON invalide)",
    429: "⚠️  RATE LIMIT EXCEEDED - Trop de requêtes (ralentissez le rythme)",
    500: "Internal Server Error - Erreur interne Discogs",
    502: "Bad Gateway - Erreur de passerelle Discogs",
    503: "Service Unavailable - Service indisponible",
    504: "Gateway Timeout - Délai d'attente dépassé",
}

# Erreurs permanentes Discogs (arrêt immédiat)
DISCOGS_PERMANENT_ERRORS = {400, 401, 403, 404, 405, 406, 415, 422}

# Erreurs temporaires Discogs (retry avec backoff)
DISCOGS_TEMPORARY_ERRORS = {408, 413, 429, 500, 502, 503, 504}


# ═══════════════════════════════════════════════════════════
# MODE TEST
# ═══════════════════════════════════════════════════════════

def test_services(insecure: bool = False, proxy: Optional[str] = None) -> bool:
    """Teste la connexion et l'authentification aux services API"""
    logger.info("🔍 TEST DE CONNEXION AUX SERVICES API")
    logger.info("=" * 80)

    all_ok = True
    protocol = "HTTP" if insecure else "HTTPS"

    session = requests.Session()
    if proxy:
        session.proxies = {'http': proxy, 'https': proxy}

    # ─── Test Last.fm ──────────────────────────────────────────
    logger.info(f"\n🌐 Last.fm ({protocol}):")

    try:
        start = time.time()
        ip = socket.gethostbyname('ws.audioscrobbler.com')
        elapsed = (time.time() - start) * 1000
        logger.info(f"   ✅ DNS résolu: {ip} (temps: {elapsed:.0f}ms)")
    except Exception as e:
        logger.error(f"   ❌ DNS échoué: {e}")
        all_ok = False

    if LASTFM_API_KEY:
        try:
            base_url = LASTFM_API_URL_HTTP if insecure else LASTFM_API_URL_HTTPS
            response = session.get(
                base_url,
                params={
                    'method': 'artist.getinfo',
                    'artist': 'Metallica',
                    'api_key': LASTFM_API_KEY,
                    'format': 'json'
                },
                timeout=15
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('artist'):
                    logger.info(f"   ✅ Clé API valide (Metallica trouvé) - HTTP {response.status_code}")
                elif 'error' in data:
                    error_code = data.get('error')
                    logger.error(f"   ❌ {LASTFM_ERROR_CODES.get(error_code, f'Erreur {error_code}')}")
                    if error_code in LASTFM_PERMANENT_ERRORS:
                        logger.error("   → Arrêt immédiat. Corrigez l'erreur.")
                    all_ok = False
                else:
                    logger.error(f"   ❌ Réponse inattendue: {data}")
                    all_ok = False
            elif response.status_code in MUSICBRAINZ_HTTP_ERRORS:
                logger.error(f"   ❌ {MUSICBRAINZ_HTTP_ERRORS.get(response.status_code, f'HTTP {response.status_code}')}")
                all_ok = False
            else:
                logger.error(f"   ❌ Erreur HTTP {response.status_code}")
                all_ok = False
        except Exception as e:
            logger.error(f"   ❌ Connexion échouée: {e}")
            all_ok = False
    else:
        logger.error("   ❌ Clé API manquante (LASTFM_API_KEY non définie dans .env)")
        all_ok = False

    # ─── Test MusicBrainz ──────────────────────────────────────
    logger.info("\n🎵 MusicBrainz:")

    try:
        start = time.time()
        ip = socket.gethostbyname('musicbrainz.org')
        elapsed = (time.time() - start) * 1000
        logger.info(f"   ✅ DNS résolu: {ip} (temps: {elapsed:.0f}ms)")
    except Exception as e:
        logger.error(f"   ❌ DNS échoué: {e}")
        all_ok = False

    try:
        response = session.get(
            'https://musicbrainz.org/ws/2/artist/65f4f0c5-ef9e-490c-aee3-909e7ae6b2ab?fmt=json',
            headers={'User-Agent': 'MetalPedia/1.0.0 (test)'},
            timeout=15
        )
        if response.status_code == 200:
            logger.info(f"   ✅ Service disponible (Metallica trouvé) - HTTP {response.status_code}")
        elif response.status_code in MUSICBRAINZ_HTTP_ERRORS:
            logger.error(f"   ❌ {MUSICBRAINZ_HTTP_ERRORS.get(response.status_code, f'HTTP {response.status_code}')}")
            all_ok = False
        else:
            logger.error(f"   ❌ Erreur HTTP {response.status_code}")
            all_ok = False
    except Exception as e:
        logger.error(f"   ❌ Connexion échouée: {e}")
        all_ok = False

    # ─── Test Discogs ──────────────────────────────────────────
    logger.info("\n💿 Discogs:")

    try:
        start = time.time()
        ip = socket.gethostbyname('api.discogs.com')
        elapsed = (time.time() - start) * 1000
        logger.info(f"   ✅ DNS résolu: {ip} (temps: {elapsed:.0f}ms)")
    except Exception as e:
        logger.error(f"   ❌ DNS échoué: {e}")
        all_ok = False

    if DISCOGS_TOKEN:
        try:
            response = session.get(
                'https://api.discogs.com/database/search',
                params={'q': 'Metallica', 'type': 'artist', 'per_page': 1},
                headers={
                    'User-Agent': 'MetalPedia/1.0.0 (test)',
                    'Authorization': f'Discogs token={DISCOGS_TOKEN}'
                },
                timeout=15
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('results'):
                    logger.info(f"   ✅ Token valide (Metallica trouvé) - HTTP {response.status_code}")
                else:
                    logger.warning(f"   ⚠️  Token valide mais aucun résultat - HTTP {response.status_code}")
            elif response.status_code == 401:
                logger.error(f"   ❌ {DISCOGS_HTTP_ERRORS.get(401, 'Token invalide')}")
                logger.error("   → Vérifiez votre DISCOGS_TOKEN dans .env")
                all_ok = False
            elif response.status_code in DISCOGS_HTTP_ERRORS:
                logger.error(f"   ❌ {DISCOGS_HTTP_ERRORS.get(response.status_code, f'HTTP {response.status_code}')}")
                if response.status_code in DISCOGS_PERMANENT_ERRORS:
                    logger.error("   → Arrêt immédiat. Corrigez l'erreur.")
                all_ok = False
            else:
                logger.error(f"   ❌ Erreur HTTP {response.status_code}")
                all_ok = False
        except Exception as e:
            logger.error(f"   ❌ Connexion échouée: {e}")
            all_ok = False
    else:
        logger.info("   ℹ️  Token optionnel non fourni (25 req/min par défaut)")

    # ─── Résumé ─────────────────────────────────────────────────
    logger.info("\n" + "=" * 80)
    if all_ok:
        logger.info(f"✅ Tous les services sont accessibles ! ({protocol})")
        if insecure:
            logger.info("💡 Connexion en HTTP (mode insecure) - Si le HTTPS fonctionne, retirez --insecure")
        else:
            logger.info("💡 Connexion en HTTPS - Si vous avez des problèmes, essayez --insecure")
    else:
        logger.error("❌ Des problèmes ont été détectés. Corrigez-les avant de lancer la récupération.")
        if not insecure:
            logger.info("💡 Essayez --insecure pour utiliser HTTP au lieu de HTTPS")

    return all_ok


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
# DICTIONNAIRE ISO COMPLET (norme ISO 3166-1)
# ═══════════════════════════════════════════════════════════

ISO_TO_COUNTRY = {
    'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan',
    'AG': 'Antigua and Barbuda', 'AI': 'Anguilla', 'AL': 'Albania',
    'AM': 'Armenia', 'AO': 'Angola', 'AQ': 'Antarctica', 'AR': 'Argentina',
    'AS': 'American Samoa', 'AT': 'Austria', 'AU': 'Australia', 'AW': 'Aruba',
    'AX': 'Åland Islands', 'AZ': 'Azerbaijan', 'BA': 'Bosnia and Herzegovina',
    'BB': 'Barbados', 'BD': 'Bangladesh', 'BE': 'Belgium', 'BF': 'Burkina Faso',
    'BG': 'Bulgaria', 'BH': 'Bahrain', 'BI': 'Burundi', 'BJ': 'Benin',
    'BL': 'Saint Barthélemy', 'BM': 'Bermuda', 'BN': 'Brunei Darussalam',
    'BO': 'Bolivia', 'BQ': 'Bonaire, Sint Eustatius and Saba', 'BR': 'Brazil',
    'BS': 'Bahamas', 'BT': 'Bhutan', 'BV': 'Bouvet Island', 'BW': 'Botswana',
    'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada', 'CC': 'Cocos (Keeling) Islands',
    'CD': 'Congo (Democratic Republic)', 'CF': 'Central African Republic',
    'CG': 'Congo', 'CH': 'Switzerland', 'CI': 'Côte d\'Ivoire',
    'CK': 'Cook Islands', 'CL': 'Chile', 'CM': 'Cameroon', 'CN': 'China',
    'CO': 'Colombia', 'CR': 'Costa Rica', 'CU': 'Cuba', 'CV': 'Cabo Verde',
    'CW': 'Curaçao', 'CX': 'Christmas Island', 'CY': 'Cyprus', 'CZ': 'Czechia',
    'DE': 'Germany', 'DJ': 'Djibouti', 'DK': 'Denmark', 'DM': 'Dominica',
    'DO': 'Dominican Republic', 'DZ': 'Algeria', 'EC': 'Ecuador',
    'EE': 'Estonia', 'EG': 'Egypt', 'EH': 'Western Sahara', 'ER': 'Eritrea',
    'ES': 'Spain', 'ET': 'Ethiopia', 'FI': 'Finland', 'FJ': 'Fiji',
    'FK': 'Falkland Islands (Malvinas)', 'FM': 'Micronesia', 'FO': 'Faroe Islands',
    'FR': 'France', 'GA': 'Gabon', 'GB': 'United Kingdom', 'GD': 'Grenada',
    'GE': 'Georgia', 'GF': 'French Guiana', 'GG': 'Guernsey', 'GH': 'Ghana',
    'GI': 'Gibraltar', 'GL': 'Greenland', 'GM': 'Gambia', 'GN': 'Guinea',
    'GP': 'Guadeloupe', 'GQ': 'Equatorial Guinea', 'GR': 'Greece',
    'GS': 'South Georgia and the South Sandwich Islands', 'GT': 'Guatemala',
    'GU': 'Guam', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HK': 'Hong Kong',
    'HM': 'Heard Island and McDonald Islands', 'HN': 'Honduras', 'HR': 'Croatia',
    'HT': 'Haiti', 'HU': 'Hungary', 'ID': 'Indonesia', 'IE': 'Ireland',
    'IL': 'Israel', 'IM': 'Isle of Man', 'IN': 'India',
    'IO': 'British Indian Ocean Territory', 'IQ': 'Iraq',
    'IR': 'Iran (Islamic Republic of)', 'IS': 'Iceland', 'IT': 'Italy',
    'JE': 'Jersey', 'JM': 'Jamaica', 'JO': 'Jordan', 'JP': 'Japan',
    'KE': 'Kenya', 'KG': 'Kyrgyzstan', 'KH': 'Cambodia', 'KI': 'Kiribati',
    'KM': 'Comoros', 'KN': 'Saint Kitts and Nevis', 'KP': 'North Korea',
    'KR': 'South Korea', 'KW': 'Kuwait', 'KY': 'Cayman Islands',
    'KZ': 'Kazakhstan', 'LA': 'Lao People\'s Democratic Republic',
    'LB': 'Lebanon', 'LC': 'Saint Lucia', 'LI': 'Liechtenstein',
    'LK': 'Sri Lanka', 'LR': 'Liberia', 'LS': 'Lesotho', 'LT': 'Lithuania',
    'LU': 'Luxembourg', 'LV': 'Latvia', 'LY': 'Libya', 'MA': 'Morocco',
    'MC': 'Monaco', 'MD': 'Moldova (Republic of)', 'ME': 'Montenegro',
    'MF': 'Saint Martin (French part)', 'MG': 'Madagascar', 'MH': 'Marshall Islands',
    'MK': 'North Macedonia', 'ML': 'Mali', 'MM': 'Myanmar', 'MN': 'Mongolia',
    'MO': 'Macao', 'MP': 'Northern Mariana Islands', 'MQ': 'Martinique',
    'MR': 'Mauritania', 'MS': 'Montserrat', 'MT': 'Malta', 'MU': 'Mauritius',
    'MV': 'Maldives', 'MW': 'Malawi', 'MX': 'Mexico', 'MY': 'Malaysia',
    'MZ': 'Mozambique', 'NA': 'Namibia', 'NC': 'New Caledonia', 'NE': 'Niger',
    'NF': 'Norfolk Island', 'NG': 'Nigeria', 'NI': 'Nicaragua', 'NL': 'Netherlands',
    'NO': 'Norway', 'NP': 'Nepal', 'NR': 'Nauru', 'NU': 'Niue', 'NZ': 'New Zealand',
    'OM': 'Oman', 'PA': 'Panama', 'PE': 'Peru', 'PF': 'French Polynesia',
    'PG': 'Papua New Guinea', 'PH': 'Philippines', 'PK': 'Pakistan',
    'PL': 'Poland', 'PM': 'Saint Pierre and Miquelon', 'PN': 'Pitcairn',
    'PR': 'Puerto Rico', 'PS': 'Palestine, State of', 'PT': 'Portugal',
    'PW': 'Palau', 'PY': 'Paraguay', 'QA': 'Qatar', 'RE': 'Réunion',
    'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russia', 'RW': 'Rwanda',
    'SA': 'Saudi Arabia', 'SB': 'Solomon Islands', 'SC': 'Seychelles',
    'SD': 'Sudan', 'SE': 'Sweden', 'SG': 'Singapore',
    'SH': 'Saint Helena, Ascension and Tristan da Cunha', 'SI': 'Slovenia',
    'SJ': 'Svalbard and Jan Mayen', 'SK': 'Slovakia', 'SL': 'Sierra Leone',
    'SM': 'San Marino', 'SN': 'Senegal', 'SO': 'Somalia', 'SR': 'Suriname',
    'SS': 'South Sudan', 'ST': 'Sao Tome and Principe', 'SV': 'El Salvador',
    'SX': 'Sint Maarten (Dutch part)', 'SY': 'Syrian Arab Republic',
    'SZ': 'Eswatini', 'TC': 'Turks and Caicos Islands', 'TD': 'Chad',
    'TF': 'French Southern Territories', 'TG': 'Togo', 'TH': 'Thailand',
    'TJ': 'Tajikistan', 'TK': 'Tokelau', 'TL': 'Timor-Leste',
    'TM': 'Turkmenistan', 'TN': 'Tunisia', 'TO': 'Tonga', 'TR': 'Turkey',
    'TT': 'Trinidad and Tobago', 'TV': 'Tuvalu', 'TW': 'Taiwan (Province of China)',
    'TZ': 'Tanzania, United Republic of', 'UA': 'Ukraine', 'UG': 'Uganda',
    'UM': 'United States Minor Outlying Islands', 'US': 'United States',
    'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VA': 'Vatican City State',
    'VC': 'Saint Vincent and the Grenadines', 'VE': 'Venezuela (Bolivarian Republic of)',
    'VG': 'Virgin Islands (British)', 'VI': 'Virgin Islands (U.S.)',
    'VN': 'Vietnam', 'VU': 'Vanuatu', 'WF': 'Wallis and Futuna',
    'WS': 'Samoa', 'YE': 'Yemen', 'YT': 'Mayotte', 'ZA': 'South Africa',
    'ZM': 'Zambia', 'ZW': 'Zimbabwe',
}


# ═══════════════════════════════════════════════════════════
# CACHE LOCAL
# ═══════════════════════════════════════════════════════════

class JSONCache:
    def __init__(self, cache_path: str, name: str = "cache"):
        self.cache_path = Path(cache_path)
        self.name = name
        self.cache: Dict = {}
        self.hits = 0
        self.misses = 0
        self._load()

    def _load(self):
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r', encoding='utf-8') as f:
                    self.cache = json.load(f)
                logger.info(f"📂 Cache {self.name} chargé: {len(self.cache)} entrées depuis {self.cache_path}")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"⚠️  Impossible de charger le cache {self.name}: {e}")
                self.cache = {}
        else:
            logger.debug(f"📂 Cache {self.name} inexistant, création future dans {self.cache_path}")

    def save(self):
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_path, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False)
        logger.debug(f"💾 Cache {self.name} sauvegardé: {len(self.cache)} entrées")

    def get(self, key: str) -> Optional[Dict]:
        if key in self.cache:
            self.hits += 1
            logger.debug(f"✅ Cache hit {self.name}: {key[:50]}...")
            return self.cache[key]
        self.misses += 1
        logger.debug(f"❌ Cache miss {self.name}: {key[:50]}...")
        return None

    def set(self, key: str, data: Dict):
        self.cache[key] = data
        logger.debug(f"📝 Cache set {self.name}: {key[:50]}...")

    def stats(self) -> Dict[str, int]:
        return {'hits': self.hits, 'misses': self.misses, 'size': len(self.cache)}


# ═══════════════════════════════════════════════════════════
# CLIENT LAST.FM (AVEC CACHE ET STATISTIQUES COMPLÈTES)
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
        self.base_url = LASTFM_API_URL_HTTP if insecure else LASTFM_API_URL_HTTPS
        self.cache = JSONCache(LASTFM_CACHE_FILE, "Last.fm")
        logger.info(f"🎵 Client Last.fm initialisé ({'HTTP (insecure)' if insecure else 'HTTPS'})")

    def _request(self, params: Dict) -> Optional[Dict]:
        """Effectue une requête vers l'API Last.fm avec cache et gestion des erreurs."""
        params['api_key'] = self.api_key
        params['format'] = 'json'
        endpoint = params.get('method', 'unknown')

        max_attempts = 3
        last_error = None

        for attempt in range(max_attempts):
            try:
                time.sleep(LASTFM_DELAY)
                response = self.session.get(self.base_url, params=params, timeout=30)
                self.request_count += 1

                # ─── Gestion des erreurs HTTP ────────────────────
                if response.status_code == 200:
                    data = response.json()

                    # Vérifier les erreurs Last.fm dans le corps
                    if 'error' in data:
                        error_code = data.get('error')
                        error_message = LASTFM_ERROR_CODES.get(error_code, data.get('message', 'Unknown error'))

                        # Erreur permanente → arrêt immédiat
                        if error_code in LASTFM_PERMANENT_ERRORS:
                            logger.error(f"❌ Last.fm - Erreur {error_code}: {error_message}")
                            if error_code == 10:
                                logger.error("   → Vérifiez votre LASTFM_API_KEY dans le fichier .env")
                            elif error_code == 26:
                                logger.error("   → Contactez Last.fm pour comprendre pourquoi votre clé a été suspendue")
                            elif error_code == 27:
                                logger.error("   → Générez une nouvelle clé API sur Last.fm")
                            return None

                        # Erreur temporaire → retry avec backoff
                        elif error_code in LASTFM_TEMPORARY_ERRORS:
                            self.rate_limited_count += 1
                            wait_time = 30 * (attempt + 1)
                            logger.warning(f"⚠️  Last.fm - Erreur {error_code}: {error_message}")
                            logger.warning(f"   → Attente de {wait_time}s avant réessai (tentative {attempt+1}/{max_attempts})")
                            time.sleep(wait_time)
                            continue

                        # Autres erreurs (non classifiées)
                        else:
                            logger.error(f"❌ Last.fm - Erreur {error_code}: {error_message}")
                            return None

                    # Succès
                    logger.debug(f"📡 Last.fm {endpoint} OK (req #{self.request_count})")
                    return data

                # ─── Gestion des codes HTTP ──────────────────────
                elif response.status_code == 403:
                    logger.error(f"❌ Last.fm - HTTP 403 Forbidden")
                    logger.error("   → Votre clé API a peut-être été révoquée ou le quota est dépassé.")
                    logger.error("   → Vérifiez votre LASTFM_API_KEY et le statut de votre compte Last.fm.")
                    return None

                elif response.status_code == 429:
                    self.rate_limited_count += 1
                    wait_time = 60 * (attempt + 1)
                    logger.warning(f"⚠️  Last.fm - HTTP 429 Too Many Requests")
                    logger.warning(f"   → Attente de {wait_time}s avant réessai (tentative {attempt+1}/{max_attempts})")
                    time.sleep(wait_time)
                    continue

                elif response.status_code == 503:
                    self.rate_limited_count += 1
                    wait_time = 30 * (attempt + 1)
                    logger.warning(f"⚠️  Last.fm - HTTP 503 Service Unavailable")
                    logger.warning(f"   → Attente de {wait_time}s avant réessai (tentative {attempt+1}/{max_attempts})")
                    time.sleep(wait_time)
                    continue

                else:
                    logger.warning(f"⚠️  Last.fm {endpoint} - HTTP {response.status_code}")
                    last_error = f"HTTP {response.status_code}"
                    time.sleep(2)
                    continue

            except requests.RequestException as e:
                logger.error(f"❌ Last.fm {endpoint} - Exception réseau: {e}")
                last_error = str(e)
                if attempt < max_attempts - 1:
                    wait_time = 5 * (attempt + 1)
                    logger.info(f"   → Nouvel essai dans {wait_time}s...")
                    time.sleep(wait_time)
                continue

        # ─── Échec après toutes les tentatives ──────────────────
        logger.error(f"❌ Last.fm {endpoint} - Échec après {max_attempts} tentatives")
        if last_error:
            logger.error(f"   → Dernière erreur: {last_error}")
        return None

    def get_top_artists_by_tag(self, tag: str, limit: int = 100, page: int = 1) -> List[Dict]:
        logger.debug(f"📡 Last.fm get_top_artists_by_tag: {tag} page {page}")
        data = self._request({'method': 'tag.gettopartists', 'tag': tag, 'limit': limit, 'page': page})
        if not data:
            logger.info(f"📭 Last.fm plus d'artistes pour {tag} page {page}")
            return []
        artists = data.get('topartists', {}).get('artist', [])
        if not artists:
            logger.info(f"📭 Last.fm aucun artiste pour {tag} page {page}")
        return artists if isinstance(artists, list) else []

    def get_artist_info(self, artist_name: str, lang: Optional[str] = None) -> Optional[Dict]:
        """Récupère les informations d'un artiste avec cache."""
        cache_key = f"{artist_name.lower().strip()}_{lang or 'none'}"

        cached = self.cache.get(cache_key)
        if cached is not None:
            logger.debug(f"✅ Last.fm cache hit: {artist_name} (lang={lang})")
            return cached

        logger.debug(f"📡 Last.fm get_artist_info: {artist_name} (lang={lang})")
        params = {'method': 'artist.getinfo', 'artist': artist_name, 'autocorrect': 1}
        if lang:
            params['lang'] = lang
        data = self._request(params)

        if data:
            artist_data = data.get('artist')
            if artist_data:
                self.cache.set(cache_key, artist_data)
                logger.debug(f"💾 Last.fm cache sauvegardé: {artist_name}")
            return artist_data
        return None

    def get_artist_info_with_fallback(self, artist_name: str, preferred_lang: str = 'fr', fallback_lang: str = 'en') -> Tuple[Optional[Dict], str]:
        logger.debug(f"🔍 Récupération biographie pour {artist_name}")
        artist_data = self.get_artist_info(artist_name, lang=preferred_lang)
        if artist_data:
            bio_clean = clean_biography(artist_data.get('bio', {}).get('content', ''))
            if len(bio_clean) >= MIN_BIO_LENGTH:
                logger.info(f"✅ Biographie {preferred_lang} trouvée pour {artist_name} ({len(bio_clean)} caractères)")
                return artist_data, preferred_lang

        if preferred_lang != fallback_lang:
            logger.debug(f"🔄 Fallback vers {fallback_lang} pour {artist_name}")
            artist_data_fallback = self.get_artist_info(artist_name, lang=fallback_lang)
            if artist_data_fallback:
                bio_clean = clean_biography(artist_data_fallback.get('bio', {}).get('content', ''))
                if len(bio_clean) >= MIN_BIO_LENGTH:
                    logger.info(f"✅ Biographie {fallback_lang} trouvée pour {artist_name} ({len(bio_clean)} caractères)")
                    return artist_data_fallback, fallback_lang

        logger.warning(f"⚠️  Aucune biographie valide pour {artist_name}")
        return artist_data, 'none'

    def save_cache(self):
        if self.cache:
            self.cache.save()
            logger.info(f"💾 Cache Last.fm sauvegardé: {len(self.cache.cache)} entrées")

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
        }


# ═══════════════════════════════════════════════════════════
# CLIENT MUSICBRAINZ (AVEC GESTION EXPLICITE DES ERREURS)
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
        self.cache = JSONCache(MB_CACHE_FILE, "MBID") if use_cache else None
        self.current_backoff = mb_delay
        self.max_backoff = 120.0
        logger.info(f"🎵 Client MusicBrainz initialisé (délai: {mb_delay}s)")

    def get_artist(self, mbid: str) -> Optional[Dict]:
        if not mbid:
            logger.debug("❌ MBID vide, ignoré")
            return None

        if self.cache:
            cached = self.cache.get(mbid)
            if cached is not None:
                self.cache_hits += 1
                logger.debug(f"✅ MusicBrainz cache hit: {mbid[:8]}...")
                return cached

        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)

                url = f"{MUSICBRAINZ_API_URL}artist/{mbid}?fmt=json&inc=genres+ratings"
                response = self.session.get(url, timeout=30)
                self.request_count += 1

                if response.status_code == 200:
                    data = response.json()
                    if self.cache:
                        self.cache.set(mbid, data)
                        if len(self.cache.cache) % 50 == 0:
                            self.cache.save()
                    logger.debug(f"✅ MusicBrainz récupéré: {mbid[:8]}...")
                    return data

                elif response.status_code == 404:
                    logger.warning(f"❌ MusicBrainz - {MUSICBRAINZ_HTTP_ERRORS.get(404, 'Not Found')}")
                    self.current_backoff = self.mb_delay
                    return None

                elif response.status_code in MUSICBRAINZ_PERMANENT_ERRORS:
                    logger.error(f"❌ MusicBrainz - {MUSICBRAINZ_HTTP_ERRORS.get(response.status_code, f'HTTP {response.status_code}')}")
                    return None

                elif response.status_code in MUSICBRAINZ_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    self.current_backoff = min(self.current_backoff * 2, self.max_backoff)
                    retry_after = response.headers.get('Retry-After')
                    # 🔧 CORRECTION : forcer un délai minimum de 1 seconde
                    wait_time = max(1, int(retry_after) if retry_after else int(self.current_backoff))
                    logger.warning(f"⚠️  MusicBrainz - {MUSICBRAINZ_HTTP_ERRORS.get(response.status_code, f'HTTP {response.status_code}')}")
                    logger.warning(f"   → Tentative {attempt+1}/{max_attempts} - Attente de {wait_time}s")
                    if attempt == max_attempts - 1:
                        logger.error(f"❌ Abandon MusicBrainz après {max_attempts} tentatives pour {mbid[:8]}...")
                        return None
                    time.sleep(wait_time)
                    continue
                else:
                    logger.warning(f"❌ MusicBrainz - Erreur HTTP {response.status_code}")
                    return None

            except requests.RequestException as e:
                logger.error(f"❌ MusicBrainz - Exception réseau: {e}")
                time.sleep(2)

        return None

    def extract_country_formed_genres_ratings(self, mbid: str):
        logger.debug(f"🔍 Extraction données MusicBrainz pour {mbid[:8]}...")
        artist_data = self.get_artist(mbid)
        if not artist_data:
            logger.warning(f"❌ MusicBrainz données manquantes pour {mbid[:8]}...")
            return None, None, None, None, None, [], None, None

        country = None
        begin_area = artist_data.get('begin-area', {})
        if begin_area:
            country = begin_area.get('name')
            if not country:
                codes = begin_area.get('iso-3166-1-codes', [])
                if codes:
                    country = codes[0]
        if not country:
            area = artist_data.get('area', {})
            if area:
                country = area.get('name')
                if not country:
                    codes = area.get('iso-3166-1-codes', [])
                    if codes:
                        country = codes[0]
        if not country:
            country = artist_data.get('country')
        if country:
            country = iso_to_country_name(country)

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

        genres_list = []
        raw_genres = artist_data.get('genres', [])
        if isinstance(raw_genres, list):
            for g in raw_genres:
                name = g.get('name', '').strip()
                count = g.get('count', 0)
                if name:
                    genres_list.append({'name': name, 'count': count})
            genres_list.sort(key=lambda x: x['count'], reverse=True)

        rating = None
        rating_votes = None
        raw_rating = artist_data.get('rating', {})
        if raw_rating:
            rating = raw_rating.get('value')
            rating_votes = raw_rating.get('votes-count')
            logger.debug(f"⭐ MusicBrainz rating: {rating}/5 ({rating_votes} votes)")

        return country, formed, ended, end_date, formed_date, genres_list, rating, rating_votes

    def save_cache(self):
        if self.cache:
            self.cache.save()

    @property
    def stats(self):
        stats = {
            'api_requests': self.request_count,
            'rate_limited': self.rate_limited_count,
            'cache_hits': self.cache_hits,
        }
        if self.cache:
            stats['cache_size'] = self.cache.stats()['size']
        return stats


# ═══════════════════════════════════════════════════════════
# CLIENT DISCOGS (AVEC GESTION EXPLICITE DES ERREURS)
# ═══════════════════════════════════════════════════════════

class DiscogsClient:
    def __init__(self, token: Optional[str] = None, use_cache: bool = True, proxy: Optional[str] = None):
        self.token = token
        self.session = requests.Session()
        if proxy:
            self.session.proxies = {'http': proxy, 'https': proxy}
        self.session.headers.update({
            'User-Agent': 'MetalPedia/1.0.0 (https://github.com/sebastienbats/MetalPedia)',
            'Accept': 'application/json',
        })
        if token:
            self.session.headers.update({'Authorization': f'Discogs token={token}'})
            logger.info("💿 Client Discogs initialisé AVEC token (60 req/min)")
        else:
            logger.info("💿 Client Discogs initialisé SANS token (25 req/min)")

        self.request_count = 0
        self.rate_limited_count = 0
        self.cache = JSONCache(DISCOGS_CACHE_FILE, "Discogs") if use_cache else None
        self.last_request_time = 0

    def _request(self, endpoint: str, params: Optional[Dict] = None):
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < DISCOGS_DELAY:
            time.sleep(DISCOGS_DELAY - elapsed)
        self.last_request_time = time.time()

        url = f"{DISCOGS_API_URL}{endpoint}"
        max_attempts = 3

        for attempt in range(max_attempts):
            try:
                response = self.session.get(url, params=params, timeout=30)
                self.request_count += 1
                logger.debug(f"📡 Discogs {endpoint} (req #{self.request_count})")

                if response.status_code == 200:
                    return response.json()

                elif response.status_code in DISCOGS_PERMANENT_ERRORS:
                    logger.error(f"❌ Discogs - {DISCOGS_HTTP_ERRORS.get(response.status_code, f'HTTP {response.status_code}')}")
                    if response.status_code == 401:
                        logger.error("   → Vérifiez votre DISCOGS_TOKEN dans .env")
                    return None

                elif response.status_code in DISCOGS_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    if response.status_code == 429:
                        retry_after = int(response.headers.get('Retry-After', 60))
                        logger.warning(f"⚠️  Discogs - {DISCOGS_HTTP_ERRORS.get(429, 'Rate limit exceeded')}")
                        logger.warning(f"   → Attente de {retry_after}s avant réessai")
                        time.sleep(retry_after)
                    else:
                        wait = 5 * (attempt + 1)
                        logger.warning(f"⚠️  Discogs - {DISCOGS_HTTP_ERRORS.get(response.status_code, f'HTTP {response.status_code}')}")
                        logger.warning(f"   → Tentative {attempt+1}/{max_attempts} - Attente de {wait}s")
                        time.sleep(wait)
                    continue

                else:
                    logger.warning(f"⚠️  Discogs - Erreur HTTP {response.status_code}: {endpoint}")
                    return None

            except requests.RequestException as e:
                logger.error(f"❌ Discogs - Exception réseau: {e}")
                time.sleep(2 * (attempt + 1))

        logger.error(f"❌ Discogs - Échec après {max_attempts} tentatives: {endpoint}")
        return None

    def search_artist(self, artist_name: str):
        clean_name = artist_name.strip()
        logger.debug(f"🔍 Discogs search: {clean_name}")

        result = self._request('database/search', {'q': clean_name, 'type': 'artist', 'per_page': 1})
        if not result:
            return None

        results = result.get('results', [])
        if not results:
            logger.debug(f"📭 Discogs aucun résultat pour {clean_name}")
            return None

        first_result = results[0]
        title = first_result.get('title', '').lower()
        if clean_name.lower() not in title and title not in clean_name.lower():
            result = self._request('database/search', {'q': clean_name, 'type': 'artist', 'per_page': 3})
            if result:
                for r in result.get('results', []):
                    r_title = r.get('title', '').lower()
                    if clean_name.lower() in r_title or r_title in clean_name.lower():
                        logger.info(f"✅ Discogs trouvé: {r.get('title')} (fallback)")
                        return r

        if first_result:
            logger.info(f"✅ Discogs trouvé: {first_result.get('title')}")
        return first_result

    def get_artist_releases(self, artist_id: int, limit: int = 10):
        logger.debug(f"📡 Discogs releases pour artiste {artist_id}")
        result = self._request(f'artists/{artist_id}/releases', {'per_page': limit, 'sort': 'year', 'sort_order': 'desc'})
        return result.get('releases', []) if result else []

    def get_release_credits(self, release_id: int):
        logger.debug(f"📡 Discogs credits pour release {release_id}")
        result = self._request(f'releases/{release_id}')
        if not result:
            return []
        credits = []
        for artist in result.get('artists', []):
            credits.append({'name': artist.get('name'), 'role': artist.get('role', 'artist'), 'anv': artist.get('anv')})
        for track in result.get('tracklist', [])[:5]:
            for credit in track.get('extraartists', []):
                credits.append({'name': credit.get('name'), 'role': credit.get('role', 'unknown'), 'anv': credit.get('anv')})
        return credits

    def enrich_artist(self, artist_name: str):
        artist = self.search_artist(artist_name)
        if not artist:
            return {'albums': [], 'members': []}
        artist_id = artist.get('id')
        if not artist_id:
            return {'albums': [], 'members': []}
        releases = self.get_artist_releases(artist_id, limit=10)
        albums = []
        for release in releases:
            if release.get('type', '').lower() in ['album', 'master']:
                albums.append({'title': release.get('title'), 'year': release.get('year'), 'type': release.get('type'), 'uri': release.get('uri')})
        members = []
        if albums:
            first_album = releases[0]
            release_id = first_album.get('id')
            if release_id:
                credits = self.get_release_credits(release_id)
                seen = set()
                for credit in credits:
                    name = credit.get('name')
                    if name and name not in seen:
                        seen.add(name)
                        members.append({'name': name, 'role': credit.get('role', 'musician')})
        return {'albums': albums, 'members': members[:10], 'discogs_id': artist_id, 'discogs_uri': artist.get('uri')}

    def save_cache(self):
        if self.cache:
            self.cache.save()

    @property
    def stats(self):
        stats = {'api_requests': self.request_count, 'rate_limited': self.rate_limited_count}
        if self.cache:
            stats['cache_size'] = self.cache.stats()['size']
        return stats


# ═══════════════════════════════════════════════════════════
# UPDATE FUNCTION (avec respect de --skip-musicbrainz)
# ═══════════════════════════════════════════════════════════

def update_bands_from_file(file_path: str, fields: Optional[List[str]] = None,
                           insecure: bool = False, proxy: Optional[str] = None,
                           use_musicbrainz: bool = True) -> Tuple[List[Dict], Dict]:
    """
    Met à jour les données manquantes des groupes à partir d'un fichier JSON existant.

    Args:
        file_path: Chemin du fichier JSON à mettre à jour.
        fields: Liste des champs à mettre à jour (ex: ['country', 'albums']). Si None, tous les champs.
        insecure: Utiliser HTTP au lieu de HTTPS pour Last.fm.
        proxy: Proxy à utiliser.
        use_musicbrainz: Si True, utilise MusicBrainz pour les champs associés (country, formed, etc.).
                         Si False, ignore les champs MusicBrainz (ne met à jour que Discogs).
    """
    # Charger le fichier
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if isinstance(data, list):
        bands = data
    elif isinstance(data, dict) and 'bands' in data:
        bands = data['bands']
    else:
        raise ValueError("Format de fichier inconnu")

    # Déterminer les champs à mettre à jour
    if fields:
        update_fields = set(field.strip() for field in fields if field.strip())
    else:
        update_fields = {'country', 'formed', 'formed_date', 'status', 'disbanded_date',
                         'rating', 'rating_votes', 'albums', 'members'}

    # Si MusicBrainz est désactivé, on retire les champs MusicBrainz
    musicbrainz_fields = {'country', 'formed', 'formed_date', 'status', 'disbanded_date', 'rating', 'rating_votes'}
    if not use_musicbrainz:
        update_fields = update_fields - musicbrainz_fields
        logger.info("ℹ️  MusicBrainz désactivé : seuls les champs Discogs (albums, members) seront mis à jour.")
        if not update_fields:
            logger.warning("Aucun champ à mettre à jour après désactivation de MusicBrainz.")
            # Retourner les bandes inchangées avec des stats vides
            return bands, {'total_groups': len(bands), 'groups_updated': 0,
                           'fields': {}, 'total_albums_added': 0, 'total_members_added': 0}

    # Initialiser les clients
    musicbrainz_client = MusicBrainzClient(mb_delay=DEFAULT_MB_DELAY, use_cache=True, proxy=proxy) if use_musicbrainz else None
    discogs_client = DiscogsClient(token=DISCOGS_TOKEN, use_cache=True, proxy=proxy) if DISCOGS_TOKEN else None

    stats = {
        'total_groups': len(bands),
        'groups_updated': 0,
        'fields': {field: 0 for field in update_fields},
        'total_albums_added': 0,
        'total_members_added': 0,
    }

    updated_bands = []
    for band in tqdm(bands, desc="Mise à jour"):
        name = band.get('name')
        mbid = band.get('mbid')
        changed = False

        # Vérifier les champs manquants (seulement ceux dans update_fields)
        missing = []
        if 'country' in update_fields and (not band.get('country') or band.get('country') == 'Unknown'):
            missing.append('country')
        if 'formed' in update_fields and band.get('formed') is None:
            missing.append('formed')
        if 'formed_date' in update_fields and band.get('formed_date') is None:
            missing.append('formed_date')
        if 'status' in update_fields and band.get('status') is None:
            missing.append('status')
        if 'disbanded_date' in update_fields and band.get('disbanded_date') is None:
            missing.append('disbanded_date')
        if 'rating' in update_fields and band.get('rating') is None:
            missing.append('rating')
        if 'rating_votes' in update_fields and band.get('rating_votes') is None:
            missing.append('rating_votes')
        if 'albums' in update_fields and (not band.get('albums') or len(band.get('albums', [])) == 0):
            missing.append('albums')
        if 'members' in update_fields and (not band.get('members') or len(band.get('members', [])) == 0):
            missing.append('members')

        if not missing:
            updated_bands.append(band)
            continue

        # MusicBrainz (seulement si le client est activé et que des champs MusicBrainz sont manquants)
        if musicbrainz_client and any(f in missing for f in musicbrainz_fields):
            if mbid:
                (mb_country, mb_formed, mb_ended, mb_end_date, mb_formed_date,
                 mb_genres, mb_rating, mb_rating_votes) = musicbrainz_client.extract_country_formed_genres_ratings(mbid)

                if 'country' in missing and mb_country and (not band.get('country') or band['country'] == 'Unknown'):
                    band['country'] = mb_country
                    band['country_source'] = 'musicbrainz'
                    stats['fields']['country'] += 1
                    changed = True
                if 'formed' in missing and mb_formed and band.get('formed') is None:
                    band['formed'] = mb_formed
                    band['formed_source'] = 'musicbrainz'
                    stats['fields']['formed'] += 1
                    changed = True
                if 'formed_date' in missing and mb_formed_date and band.get('formed_date') is None:
                    band['formed_date'] = mb_formed_date
                    stats['fields']['formed_date'] += 1
                    changed = True
                if 'status' in missing and mb_ended is not None and band.get('status') is None:
                    band['status'] = 'Split up' if mb_ended else 'Active'
                    stats['fields']['status'] += 1
                    changed = True
                if 'disbanded_date' in missing and mb_end_date and band.get('disbanded_date') is None:
                    band['disbanded_date'] = mb_end_date
                    stats['fields']['disbanded_date'] += 1
                    changed = True
                if 'rating' in missing and mb_rating is not None and band.get('rating') is None:
                    band['rating'] = mb_rating
                    stats['fields']['rating'] += 1
                    changed = True
                if 'rating_votes' in missing and mb_rating_votes is not None and band.get('rating_votes') is None:
                    band['rating_votes'] = mb_rating_votes
                    stats['fields']['rating_votes'] += 1
                    changed = True

        # Discogs (pour albums et members)
        if discogs_client and any(f in missing for f in ['albums', 'members']):
            if name:
                discogs_data = discogs_client.enrich_artist(name)
                if discogs_data:
                    if 'albums' in missing and discogs_data.get('albums') and (not band.get('albums') or len(band.get('albums', [])) == 0):
                        band['albums'] = discogs_data['albums']
                        stats['fields']['albums'] += 1
                        stats['total_albums_added'] += len(discogs_data['albums'])
                        changed = True
                    if 'members' in missing and discogs_data.get('members') and (not band.get('members') or len(band.get('members', [])) == 0):
                        band['members'] = discogs_data['members']
                        stats['fields']['members'] += 1
                        stats['total_members_added'] += len(discogs_data['members'])
                        changed = True

        if changed:
            stats['groups_updated'] += 1

        updated_bands.append(band)

    # Sauvegarder les caches
    if musicbrainz_client:
        musicbrainz_client.save_cache()
    if discogs_client:
        discogs_client.save_cache()

    return updated_bands, stats


# ═══════════════════════════════════════════════════════════
# UTILITAIRES ET TRAITEMENT
# ═══════════════════════════════════════════════════════════

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


def clean_biography(bio_content: str) -> str:
    if not bio_content:
        return ''
    clean = re.sub(r'<[^>]+>', '', bio_content)
    clean = re.sub(r'\s*(?:Read more|Lire la suite|Mehr lesen|Más información|Leggi tutto).*$', '', clean, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'https?://www\.last\.fm[^\s]*', '', clean)
    return re.sub(r'\s+', ' ', clean).strip()[:2000]


def process_artist(artist_data: Dict, source_tag: str, bio_lang: str,
                   musicbrainz_client: Optional[MusicBrainzClient] = None,
                   discogs_client: Optional[DiscogsClient] = None) -> Optional[Dict]:
    if not artist_data:
        return None
    name = artist_data.get('name', '').strip()
    if not name:
        return None
    tags = artist_data.get('tags', {}).get('tag', [])
    if not isinstance(tags, list):
        tags = []
    genre = None
    genre_source = None
    biography = clean_biography(artist_data.get('bio', {}).get('content', ''))
    images = artist_data.get('image', [])
    image_url = next((img['#text'] for img in reversed(images) if img.get('#text')), None)
    try:
        listeners = int(artist_data.get('stats', {}).get('listeners', 0) or 0)
    except:
        listeners = 0
    country, country_source = None, None
    formed, formed_source = None, None
    formed_date = None
    status = 'Active'
    disbanded_date = None
    rating = None
    rating_votes = None
    mbid = artist_data.get('mbid', '').strip()
    discogs_data = None
    if musicbrainz_client and mbid:
        (mb_country, mb_formed, mb_ended, mb_end_date, mb_formed_date,
         mb_genres, mb_rating, mb_rating_votes) = musicbrainz_client.extract_country_formed_genres_ratings(mbid)
        if mb_country:
            country, country_source = mb_country, 'musicbrainz'
        if mb_formed:
            formed, formed_source = mb_formed, 'musicbrainz'
        if mb_ended is not None:
            status = 'Split up' if mb_ended else 'Active'
        disbanded_date = mb_end_date
        formed_date = mb_formed_date
        rating = mb_rating
        rating_votes = mb_rating_votes
        if mb_genres:
            genre = mb_genres[0]['name'].title()
            genre_source = 'musicbrainz'
    if discogs_client and name:
        cache_key = name.lower().strip()
        cached = discogs_client.cache.get(cache_key) if discogs_client.cache else None
        if cached:
            discogs_data = cached
        else:
            discogs_data = discogs_client.enrich_artist(name)
            if discogs_client.cache:
                discogs_client.cache.set(cache_key, discogs_data)
    if not genre:
        genre = extract_genre_from_tags(tags)
        genre_source = 'lastfm_tags'
    if not country:
        tag_country = extract_country_from_tags(tags)
        if tag_country:
            country, country_source = tag_country, 'lastfm_tags'
    if not country:
        country, country_source = 'Unknown', 'unknown'
    if not formed_source:
        formed_source = 'unknown'
    result = {
        'name': name,
        'genre': genre,
        'genre_source': genre_source,
        'country': country,
        'country_source': country_source,
        'formed': formed,
        'formed_date': formed_date,
        'formed_source': formed_source,
        'status': status,
        'disbanded_date': disbanded_date,
        'rating': rating,
        'rating_votes': rating_votes,
        'mbid': mbid or None,
        'biography': biography or None,
        'bio_lang': bio_lang,
        'image_url': image_url,
        'listeners': listeners,
        'source_tag': source_tag,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
    }
    if discogs_data:
        result['discogs_id'] = discogs_data.get('discogs_id')
        result['discogs_uri'] = discogs_data.get('discogs_uri')
        result['albums'] = discogs_data.get('albums', [])
        result['members'] = discogs_data.get('members', [])
    return result


# ═══════════════════════════════════════════════════════════
# GESTION DE LA PROGRESSION
# ═══════════════════════════════════════════════════════════

def load_progress(path: str) -> Dict:
    if not Path(path).exists():
        return {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 1}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if data.get('last_page', 1) < 1:
            data['last_page'] = 1
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
# FONCTION PRINCIPALE DE RÉCUPÉRATION
# ═══════════════════════════════════════════════════════════

def fetch_all_metal_bands(limit: int, resume: bool, progress_path: str,
                          preferred_lang: str, use_musicbrainz: bool,
                          mb_delay: float, use_discogs: bool,
                          insecure: bool = False, proxy: Optional[str] = None):
    if not LASTFM_API_KEY:
        logger.error("❌ Erreur: LASTFM_API_KEY non définie dans .env")
        return [], {}, {}, {}
    logger.info("🎸 Démarrage de la récupération des groupes metal")
    logger.info(f"📊 Limite: {limit} groupes")
    logger.info(f"🌍 Langue: {preferred_lang.upper()}")
    lastfm_client = LastFmClient(LASTFM_API_KEY, default_lang=preferred_lang, insecure=insecure, proxy=proxy)
    musicbrainz_client = MusicBrainzClient(mb_delay=mb_delay, use_cache=use_musicbrainz, proxy=proxy) if use_musicbrainz else None
    discogs_client = DiscogsClient(token=DISCOGS_TOKEN, use_cache=use_discogs, proxy=proxy) if use_discogs else None
    if resume:
        progress = load_progress(progress_path)
        seen_names = set(progress.get('seen_names', []))
        bands_list = progress.get('bands', [])
        start_tag_idx = progress.get('last_tag_index', 0)
        start_page = progress.get('last_page', 1)
        logger.info(f"🔄 Reprise depuis le tag {start_tag_idx}, page {start_page} ({len(bands_list)} groupes)")
    else:
        progress = {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 1}
        seen_names, bands_list = set(), []
        start_tag_idx, start_page = 0, 1
    logger.info(f"📊 {len(METAL_TAGS)} sous-genres à parcourir")
    if use_musicbrainz:
        logger.info(f"🎵 MusicBrainz: ACTIVÉ (délai: {mb_delay}s) - SANS clé API")
    else:
        logger.info("⏭️  MusicBrainz: DÉSACTIVÉ")
    if use_discogs:
        token_status = "AVEC token" if DISCOGS_TOKEN else "SANS token"
        logger.info(f"💿 Discogs: ACTIVÉ ({token_status}) - 60/25 req/min")
    else:
        logger.info("⏭️  Discogs: DÉSACTIVÉ")
    for tag_idx, tag in enumerate(tqdm(METAL_TAGS[start_tag_idx:], desc="Genres", initial=start_tag_idx)):
        actual_tag_idx = start_tag_idx + tag_idx
        page = start_page if tag_idx == 0 else 1
        logger.info(f"🏷️ Traitement du tag {tag} (index {actual_tag_idx})")
        while len(bands_list) < limit:
            artists = lastfm_client.get_top_artists_by_tag(tag, limit=100, page=page)
            if not artists:
                logger.info(f"📭 Tag {tag} terminé (page {page-1})")
                break
            for artist in artists:
                if len(bands_list) >= limit:
                    break
                artist_name = artist.get('name', '').strip()
                if not artist_name or artist_name in seen_names:
                    continue
                seen_names.add(artist_name)
                artist_info, actual_lang = lastfm_client.get_artist_info_with_fallback(artist_name, preferred_lang, 'en')
                if artist_info:
                    lastfm_client.bio_stats[f'bio_{preferred_lang}' if actual_lang == preferred_lang else ('bio_en' if actual_lang == 'en' else 'bio_none')] += 1
                    processed = process_artist(artist_info, tag, actual_lang, musicbrainz_client, discogs_client)
                    if processed:
                        bands_list.append(processed)
                        progress['seen_names'] = list(seen_names)
                        progress['bands'] = bands_list
                        progress['last_tag_index'] = actual_tag_idx
                        progress['last_page'] = page
                        save_progress(progress_path, progress)
                        if len(bands_list) % 100 == 0:
                            logger.info(f"📊 Progression: {len(bands_list)} groupes récupérés")
            page += 1
        if len(bands_list) >= limit:
            logger.info(f"🎯 Limite atteinte: {limit} groupes")
            break
    # Sauvegarde des caches
    lastfm_client.save_cache()
    if musicbrainz_client:
        musicbrainz_client.save_cache()
    if discogs_client:
        discogs_client.save_cache()
    logger.info(f"✅ Récupération terminée: {len(bands_list)} groupes")
    return bands_list, lastfm_client.stats, musicbrainz_client.stats if musicbrainz_client else {}, discogs_client.stats if discogs_client else {}


# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Récupère des groupes metal via Last.fm + MusicBrainz + Discogs',
        epilog='''
Configuration des clés API dans .env:
  LASTFM_API_KEY=votre_clé_lastfm        # OBLIGATOIRE
  DISCOGS_TOKEN=votre_token_discogs      # OPTIONNEL (améliore les limites)

Protocole:
  Par défaut, le script utilise HTTPS pour Last.fm.
  Utilisez --insecure pour forcer HTTP (port 80).

Mise à jour:
  --update-from fichier.json  Met à jour les données manquantes à partir d'un fichier existant.
  --update-fields champ1,champ2  Limite les champs à mettre à jour (ex: country,albums,members).
  --skip-musicbrainz est également respecté en mode mise à jour.
        ''',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT, help='Nombre maximum de groupes')
    parser.add_argument('--lang', type=str, default=DEFAULT_LANG, choices=['fr', 'en'], help='Langue préférée pour les biographies')
    parser.add_argument('--mb-delay', type=float, default=DEFAULT_MB_DELAY, help='Délai entre les requêtes MusicBrainz (secondes)')
    parser.add_argument('--skip-musicbrainz', action='store_true', help='Désactive l\'enrichissement MusicBrainz (également en mode update)')
    parser.add_argument('--with-discogs', action='store_true', help='Active l\'enrichissement Discogs')
    parser.add_argument('--insecure', action='store_true', help='Force HTTP pour Last.fm (par défaut HTTPS)')
    parser.add_argument('--test', action='store_true', help='Teste la connexion aux API sans récupérer de données')
    parser.add_argument('--resume', action='store_true', help='Reprend la récupération')
    parser.add_argument('--reset', action='store_true', help='Réinitialise la progression')
    parser.add_argument('--clear-mb-cache', action='store_true', help='Efface le cache MBID')
    parser.add_argument('--clear-discogs-cache', action='store_true', help='Efface le cache Discogs')
    parser.add_argument('--clear-lastfm-cache', action='store_true', help='Efface le cache Last.fm')
    parser.add_argument('--log-level', type=str, default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    parser.add_argument('--no-log-file', action='store_true', help='Désactive le fichier de log')
    parser.add_argument('--output', type=str, default=None, help='Nom personnalisé du fichier de sortie')
    parser.add_argument('--proxy', type=str, default=None, help='Proxy à utiliser (ex: http://proxy.entreprise.com:8080)')
    parser.add_argument('--update-from', type=str, default=None,
                        help='Fichier JSON existant à mettre à jour (ex: ../data/metal_bands_latest.json)')
    parser.add_argument('--update-fields', type=str, default=None,
                        help='Champs à mettre à jour (séparés par des virgules, ex: country,albums,members). Par défaut, tous les champs manquants.')
    args = parser.parse_args()

    # Configuration des logs
    log_file = None if args.no_log_file else LOG_FILE
    setup_logging(args.log_level, log_file)

    logger.info("=" * 80)
    logger.info("🚀 METAL FETCHER - Démarrage")
    logger.info("=" * 80)
    logger.info(f"🔧 Arguments: {vars(args)}")
    logger.info(f"📁 Fichier de log: {log_file or 'Désactivé'}")

    # Gestion des proxies
    proxy = args.proxy or os.getenv('HTTP_PROXY') or os.getenv('HTTPS_PROXY')
    if proxy:
        logger.info(f"🌐 Proxy utilisé: {proxy}")
    else:
        logger.info("🌐 Aucun proxy configuré (connexion directe)")

    # Affichage des clés
    logger.info("🔑 Clés API:")
    logger.info(f"   - Last.fm: {'✅ Définie' if LASTFM_API_KEY else '❌ MANQUANTE'}")
    logger.info(f"   - Discogs: {'✅ Définie' if DISCOGS_TOKEN else 'ℹ️  Optionnelle (25 req/min)'}")
    logger.info(f"   - Protocole Last.fm: {'HTTP (insecure)' if args.insecure else 'HTTPS'}")
    logger.info(f"   - MusicBrainz: {'❌ DÉSACTIVÉ' if args.skip_musicbrainz else '✅ ACTIVÉ'}")

    # Mode test
    if args.test:
        success = test_services(insecure=args.insecure, proxy=proxy)
        sys.exit(0 if success else 1)

    # Mode mise à jour
    if args.update_from:
        logger.info(f"🔄 Mise à jour du fichier {args.update_from}...")
        update_fields = args.update_fields.split(',') if args.update_fields else None
        try:
            updated_bands, update_stats = update_bands_from_file(
                args.update_from,
                fields=update_fields,
                insecure=args.insecure,
                proxy=proxy,
                use_musicbrainz=not args.skip_musicbrainz  # ← Respect de l'option
            )
            # Sauvegarder le résultat
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
            else:
                output_path = generate_output_filename('metal_bands_updated', '../data')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(updated_bands, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ Fichier mis à jour sauvegardé dans {output_path}")

            # Afficher les statistiques
            logger.info("\n📊 STATISTIQUES DE MISE À JOUR")
            logger.info(f"   Groupes traités : {update_stats['total_groups']}")
            logger.info(f"   Groupes mis à jour : {update_stats['groups_updated']}")
            for field, count in update_stats['fields'].items():
                if count > 0:
                    logger.info(f"   - {field}: {count} groupes mis à jour")
            if update_stats.get('total_albums_added', 0) > 0:
                logger.info(f"   Albums ajoutés : {update_stats['total_albums_added']}")
            if update_stats.get('total_members_added', 0) > 0:
                logger.info(f"   Membres ajoutés : {update_stats['total_members_added']}")

            sys.exit(0)
        except Exception as e:
            logger.error(f"❌ Erreur lors de la mise à jour: {e}", exc_info=True)
            sys.exit(1)

    # Gestion des caches (pour le mode récupération)
    if args.reset:
        reset_progress(PROGRESS_FILE)
    if args.clear_mb_cache:
        Path(MB_CACHE_FILE).unlink(missing_ok=True)
        logger.info("🗑️  Cache MBID effacé")
    if args.clear_discogs_cache:
        Path(DISCOGS_CACHE_FILE).unlink(missing_ok=True)
        logger.info("🗑️  Cache Discogs effacé")
    if args.clear_lastfm_cache:
        Path(LASTFM_CACHE_FILE).unlink(missing_ok=True)
        logger.info("🗑️  Cache Last.fm effacé")

    # Lancement de la récupération
    try:
        bands, lastfm_stats, mb_stats, discogs_stats = fetch_all_metal_bands(
            limit=args.limit,
            resume=args.resume,
            progress_path=PROGRESS_FILE,
            preferred_lang=args.lang,
            use_musicbrainz=not args.skip_musicbrainz,
            mb_delay=args.mb_delay,
            use_discogs=args.with_discogs,
            insecure=args.insecure,
            proxy=proxy
        )

        if bands:
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
            else:
                output_path = generate_output_filename('metal_bands', '../data')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(bands, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ {len(bands)} groupes sauvegardés dans {output_path}")
            if not args.output:
                latest_link = Path('../data') / 'metal_bands_latest.json'
                if latest_link.exists() or latest_link.is_symlink():
                    logger.info(f"🔗 Dernier fichier: {latest_link}")
        else:
            logger.warning("⚠️  Aucun groupe récupéré")

        # ─── Affichage des statistiques complètes ──────────────
        logger.info("\n" + "=" * 80)
        logger.info("📊 STATISTIQUES FINALES")
        logger.info("=" * 80)

        # Last.fm
        logger.info("🎵 Last.fm:")
        logger.info(f"   - Requêtes API : {lastfm_stats.get('api_requests', 0)}")
        logger.info(f"   - Rate limits : {lastfm_stats.get('rate_limited', 0)}")
        logger.info(f"   - Entrées en cache : {lastfm_stats.get('cache_size', 0)}")
        logger.info(f"   - Cache hits : {lastfm_stats.get('cache_hits', 0)}")
        logger.info(f"   - Biographies FR : {lastfm_stats.get('bio_fr', 0)}")
        logger.info(f"   - Biographies EN : {lastfm_stats.get('bio_en', 0)}")
        logger.info(f"   - Biographies non trouvées : {lastfm_stats.get('bio_none', 0)}")

        # MusicBrainz
        if mb_stats:
            logger.info("🎵 MusicBrainz (SANS clé API):")
            logger.info(f"   - Requêtes API : {mb_stats.get('api_requests', 0)}")
            logger.info(f"   - Rate limits : {mb_stats.get('rate_limited', 0)}")
            logger.info(f"   - Cache hits : {mb_stats.get('cache_hits', 0)}")
            logger.info(f"   - Entrées en cache : {mb_stats.get('cache_size', 0)}")

        # Discogs
        if discogs_stats:
            token_status = "AVEC token" if DISCOGS_TOKEN else "SANS token"
            logger.info(f"💿 Discogs ({token_status}):")
            logger.info(f"   - Requêtes API : {discogs_stats.get('api_requests', 0)}")
            logger.info(f"   - Rate limits : {discogs_stats.get('rate_limited', 0)}")
            logger.info(f"   - Entrées en cache : {discogs_stats.get('cache_size', 0)}")

        logger.info("=" * 80)
        logger.info("✅ METAL FETCHER - Terminé avec succès")
        logger.info("=" * 80)

    except KeyboardInterrupt:
        logger.warning("⚠️  Interruption par l'utilisateur (Ctrl+C)")
        logger.info("💡 Utilisez --resume pour reprendre plus tard")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
