#!/usr/bin/env python3
"""
Récupère des groupes metal via Last.fm + MusicBrainz + Discogs + Cover Art Archive.

Fonctionnalités :
  - Récupération des groupes par sous-genre metal (Last.fm tag.getTopArtists)
  - Biographies multi-langues (FR → EN fallback)
  - Albums via Last.fm artist.getTopAlbums
  - Enrichissement des albums avec Discogs (year, type, uri, image_url)
  - ✨ L'URI Discogs remplace directement le champ 'uri' (compatible import_to_supabase)
  - Membres via MusicBrainz artist-rels + Discogs (fallback)
  - Images artistes via Last.fm → MusicBrainz + Wikimedia Commons
  - Covers albums via Last.fm / Discogs → Cover Art Archive (fallback)
  - Résolution du pays via hiérarchie des zones MusicBrainz (ville → pays)
  - Support de --min-listeners dans toutes les configurations
  - Support de image_url et original_name en mode --update-from
  - Cache agressif : sauvegarde automatique toutes les 10 entrées
  - Filtre par type d'album (--filter-album-type master) avec limitation à N albums par artiste
  - Format de sortie : {"bands": [...]}

Usage:
  python fetch_metal_bands.py --limit 500 --with-discogs --min-listeners 5000
  python fetch_metal_bands.py --limit 10 --min-listeners 5000 --with-discogs --filter-album-type master --max-albums-per-band 5
  python fetch_metal_bands.py --update-from ../data/metal_bands_latest.json --update-fields mbid,album_mbid,image_url,original_name
  python fetch_metal_bands.py --test
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
COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php'
COVERART_ARCHIVE_URL = 'https://coverartarchive.org'

CAA_THUMB_SIZE = '500'
CAA_DELAY = 0.3

DEFAULT_OUTPUT = '../data/metal_bands.json'
DEFAULT_LIMIT = 10000
DEFAULT_LANG = 'fr'
MIN_BIO_LENGTH = 100
MAX_BIO_LENGTH = None

LASTFM_DELAY = 0.25
DEFAULT_MB_DELAY = 1.0
DISCOGS_DELAY = 1.1

CACHE_SAVE_INTERVAL = 10

PLACEHOLDER_HASHES = ('2a96cbd8b46e442fc41c2b86b821562f',)
LASTFM_SIZE_ORDER = ('mega', 'extralarge', 'large', 'medium', 'small')
MB_MIN_SCORE = 50

MB_CACHE_FILE = '../data/mbid_cache.json'
DISCOGS_CACHE_FILE = '../data/discogs_cache.json'
LASTFM_CACHE_FILE = '../data/lastfm_cache.json'
CAA_CACHE_FILE = '../data/coverart_cache.json'
PROGRESS_FILE = '../data/fetch_progress.json'
LOG_FILE = '../logs/metal_fetcher.log'

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

logger = logging.getLogger(__name__)

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

# ═══════════════════════════════════════════════════════════
# DICTIONNAIRES DES CODES D'ERREUR
# ═══════════════════════════════════════════════════════════

LASTFM_ERROR_CODES = {
    2: "Invalid method", 4: "Authentication failed", 5: "Invalid API key",
    6: "Invalid session key", 8: "Operation failed",
    10: "❌ INVALID API KEY", 11: "Service offline",
    16: "Service temporarily unavailable", 26: "❌ API KEY SUSPENDED",
    27: "❌ API KEY EXPIRED", 29: "⚠️ RATE LIMIT EXCEEDED",
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
            response = session.get(
                base_url,
                params={'method': 'artist.getinfo', 'artist': 'Metallica',
                        'api_key': LASTFM_API_KEY, 'format': 'json'},
                timeout=15
            )
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
        response = session.get(
            'https://musicbrainz.org/ws/2/artist/65f4f0c5-ef9e-490c-aee3-909e7ae6b2ab?fmt=json',
            headers={'User-Agent': 'MetalPedia/1.0.0 (test)'}, timeout=15
        )
        if response.status_code == 200:
            logger.info("   ✅ Service disponible")
        else:
            logger.error(f"   ❌ Erreur HTTP {response.status_code}")
            all_ok = False
    except Exception as e:
        logger.error(f"   ❌ Connexion échouée: {e}")
        all_ok = False

    logger.info("\n🖼️  Wikimedia Commons:")
    try:
        response = session.get(
            COMMONS_API_URL,
            params={'action': 'query', 'titles': 'File:Metallica live London 2008.jpg',
                    'prop': 'imageinfo', 'iiprop': 'url', 'format': 'json'},
            headers={'User-Agent': 'MetalPedia/1.0.0 (test)'}, timeout=15
        )
        if response.status_code == 200:
            logger.info("   ✅ Service disponible")
        else:
            logger.error(f"   ❌ Erreur HTTP {response.status_code}")
            all_ok = False
    except Exception as e:
        logger.error(f"   ❌ Connexion échouée: {e}")
        all_ok = False

    logger.info("\n🎨 Cover Art Archive:")
    try:
        response = session.get(
            f'{COVERART_ARCHIVE_URL}/release/00000000-0000-0000-0000-000000000000',
            headers={'User-Agent': 'MetalPedia/1.0.0 (test)', 'Accept': 'application/json'},
            timeout=15
        )
        if response.status_code in (200, 404):
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
            response = session.get(
                'https://api.discogs.com/database/search',
                params={'q': 'Metallica', 'type': 'artist', 'per_page': 1},
                headers={'User-Agent': 'MetalPedia/1.0.0 (test)',
                         'Authorization': f'Discogs token={DISCOGS_TOKEN}'},
                timeout=15
            )
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
# ✨ CACHE LOCAL AVEC SAUVEGARDE AUTOMATIQUE
# ═══════════════════════════════════════════════════════════

class JSONCache:
    """Cache JSON avec sauvegarde automatique toutes les N nouvelles entrées."""
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
# UTILITAIRES POUR LES IMAGES ET NORMALISATION
# ═══════════════════════════════════════════════════════════

def is_placeholder(url: Optional[str]) -> bool:
    if not url:
        return True
    return any(h in url for h in PLACEHOLDER_HASHES)

def pick_best_lastfm_image(images: List[Dict]) -> Optional[str]:
    if isinstance(images, dict):
        images = [images]
    by_size = {
        img.get('size'): (img.get('#text') or '')
        for img in images
        if isinstance(img, dict)
    }
    for size in LASTFM_SIZE_ORDER:
        url = by_size.get(size)
        if not is_placeholder(url):
            return url
    return None

def query_commons_image_url(file_title: str, session: requests.Session, width: int = 800) -> Optional[str]:
    try:
        response = session.get(
            COMMONS_API_URL,
            params={'action': 'query', 'titles': file_title, 'prop': 'imageinfo',
                    'iiprop': 'url', 'iiurlwidth': width, 'format': 'json'},
            headers={'User-Agent': 'MetalPedia/1.0.0 (https://github.com/sebastienbats/MetalPedia)'},
            timeout=15
        )
        response.raise_for_status()
        pages = response.json().get('query', {}).get('pages', {})
        for page in pages.values():
            infos = page.get('imageinfo') or []
            if infos:
                return infos[0].get('thumburl') or infos[0].get('url')
    except requests.RequestException as e:
        logger.warning(f"⚠️  Wikimedia Commons - Erreur: {e}")
    return None

def normalize_album_title(title: str) -> str:
    """Normalisation simple pour le matching Discogs (année, type, image)."""
    if not title:
        return ''
    normalized = title.lower()
    normalized = re.sub(r'\([^)]*\)', '', normalized)
    normalized = re.sub(r'\[[^\]]*\]', '', normalized)
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

# ═══════════════════════════════════════════════════════════
# CLIENT LAST.FM
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
        self.album_stats = {'total_albums': 0, 'artists_with_albums': 0}
        self.base_url = LASTFM_API_URL_HTTP if insecure else LASTFM_API_URL_HTTPS
        self.cache = JSONCache(LASTFM_CACHE_FILE, "Last.fm", save_interval=CACHE_SAVE_INTERVAL)
        logger.info(f"🎵 Client Last.fm initialisé ({'HTTP' if insecure else 'HTTPS'})")

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

    def get_artist_albums(self, artist_name: str, limit: int = 100, max_pages: Optional[int] = None) -> List[Dict]:
        cache_key = f"albums:{artist_name.lower().strip()}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached.get('albums', [])
        
        albums = []
        page = 1
        while True:
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
                album_artist = album.get('artist', {})
                album_image = pick_best_lastfm_image(album.get('image', []))
                album_url = album.get('url')
                albums.append({
                    'name': album.get('name'),
                    'artist': album_artist.get('name') if isinstance(album_artist, dict) else album_artist,
                    'mbid': album.get('mbid') or None,
                    'url': album_url,
                    'uri': album_url,  # ✨ L'URI est l'URL Last.fm par défaut
                    'playcount': album.get('playcount'),
                    'image': album_image,
                    'year': None,
                    'type': None,
                })
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
        
        self.album_stats['total_albums'] += len(albums)
        if albums:
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
            'total_albums': self.album_stats.get('total_albums', 0),
        }

# ═══════════════════════════════════════════════════════════
# CLIENT MUSICBRAINZ (avec résolution du pays par hiérarchie)
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
        self.image_stats = {'wikimedia_commons': 0, 'no_image': 0}
        self.member_stats = {'members_found': 0, 'bands_with_members': 0}
        self.country_stats = {'resolved_direct': 0, 'resolved_hierarchy': 0, 'unresolved': 0}
        logger.info(f"🎵 Client MusicBrainz initialisé (délai: {mb_delay}s)")

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
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)
                response = self.session.get(
                    f"{MUSICBRAINZ_API_URL}artist",
                    params={'query': f'artist:"{artist_name}"', 'fmt': 'json', 'limit': 1},
                    timeout=30
                )
                self.request_count += 1
                if response.status_code == 200:
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
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                base_delay = min(self.current_backoff, self.max_backoff)
                jitter = base_delay * 0.2 * (random.random() * 2 - 1)
                delay = max(0.5, base_delay + jitter)
                time.sleep(delay)
                response = self.session.get(
                    f"{MUSICBRAINZ_API_URL}release-group",
                    params={'query': f'release:"{album_title}" AND artist:"{artist_name}"', 'fmt': 'json', 'limit': 1},
                    timeout=30
                )
                self.request_count += 1
                if response.status_code == 200:
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
                members.append({
                    'name': name,
                    'role': role,
                    'source': 'musicbrainz',
                    'begin': rel.get('begin'),
                    'end': rel.get('end'),
                    'ended': rel.get('ended', False),
                })
        if members:
            self.member_stats['members_found'] += len(members)
            self.member_stats['bands_with_members'] += 1
        return members

    def resolve_area_to_country(self, area_data: Dict) -> Optional[str]:
        """Résout une zone MusicBrainz (ville, région) vers le pays correspondant."""
        if not area_data:
            return None
        iso_codes = area_data.get('iso-3166-1-codes', [])
        if iso_codes:
            country_code = iso_codes[0]
            self.country_stats['resolved_direct'] += 1
            return iso_to_country_name(country_code)
        area_type = area_data.get('type', '')
        if area_type == 'Country':
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
            response = self.session.get(
                f"{MUSICBRAINZ_API_URL}area/{area_id}",
                params={'inc': 'area-rels', 'fmt': 'json'},
                timeout=30
            )
            self.request_count += 1
            if response.status_code == 200:
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
                        parent_type = parent_area.get('type', '')
                        if parent_type == 'Country':
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
        artist_country_code = artist_data.get('country')
        if artist_country_code:
            country = iso_to_country_name(artist_country_code)
        if not country:
            begin_area = artist_data.get('begin-area', {})
            if begin_area:
                country = self.resolve_area_to_country(begin_area)
        if not country:
            area = artist_data.get('area', {})
            if area:
                country = self.resolve_area_to_country(area)
        if not country:
            begin_area = artist_data.get('begin-area', {})
            if begin_area:
                area_name = begin_area.get('name', '')
                known_countries = set(ISO_TO_COUNTRY.values())
                if area_name in known_countries:
                    country = area_name
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
        return country, formed, ended, end_date, formed_date, genres_list, rating, rating_votes

    def get_artist_image(self, mbid: str) -> Optional[str]:
        if not mbid:
            return None
        artist_data = self.get_artist(mbid)
        if not artist_data:
            self.image_stats['no_image'] += 1
            return None
        relations = artist_data.get('relations', [])
        for rel in relations:
            if rel.get('type') != 'image':
                continue
            resource = rel.get('url', {}).get('resource', '')
            parsed = urlparse(resource)
            if parsed.netloc.endswith('wikimedia.org') and '/wiki/File:' in parsed.path:
                file_title = 'File:' + unquote(parsed.path.split('/wiki/File:', 1)[1])
                url = query_commons_image_url(file_title, self.session)
                if url:
                    self.image_stats['wikimedia_commons'] += 1
                    return url
        self.image_stats['no_image'] += 1
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
            'image_wikimedia_commons': self.image_stats.get('wikimedia_commons', 0),
            'members_found': self.member_stats.get('members_found', 0),
            'bands_with_members': self.member_stats.get('bands_with_members', 0),
            'country_resolved_direct': self.country_stats.get('resolved_direct', 0),
            'country_resolved_hierarchy': self.country_stats.get('resolved_hierarchy', 0),
            'country_unresolved': self.country_stats.get('unresolved', 0),
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
        self.session.headers.update({
            'User-Agent': 'MetalPedia/1.0.0 ( https://github.com/sebastienbats/MetalPedia ; mailto:contact@metalpedia.dev )',
            'Accept': 'application/json',
        })
        self.request_count = 0
        self.covers_found = 0
        self.covers_missing = 0
        self.last_request_time = 0
        self.cache = JSONCache(CAA_CACHE_FILE, "CoverArt", save_interval=CACHE_SAVE_INTERVAL) if use_cache else None
        logger.info("🎨 Client Cover Art Archive initialisé")

    def _request(self, path: str) -> Optional[Dict]:
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < CAA_DELAY:
            time.sleep(CAA_DELAY - elapsed)
        self.last_request_time = time.time()
        url = f"{COVERART_ARCHIVE_URL}/{path}"
        try:
            response = self.session.get(url, timeout=30)
            self.request_count += 1
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return None
            elif response.status_code == 503:
                return None
            else:
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
                url = (thumbnails.get(CAA_THUMB_SIZE) or thumbnails.get('500')
                       or thumbnails.get('1200') or thumbnails.get('250')
                       or front.get('image'))
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
        stats = {
            'api_requests': self.request_count,
            'covers_found': self.covers_found,
            'covers_missing': self.covers_missing,
        }
        if self.cache:
            stats['cache_size'] = self.cache.stats()['size']
        return stats

# ═══════════════════════════════════════════════════════════
# CLIENT DISCOGS (avec URI Discogs dans le champ 'uri')
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
            logger.info("💿 Client Discogs initialisé AVEC token")
        else:
            logger.info("💿 Client Discogs initialisé SANS token")
        self.request_count = 0
        self.rate_limited_count = 0
        self.cache = JSONCache(DISCOGS_CACHE_FILE, "Discogs", save_interval=CACHE_SAVE_INTERVAL) if use_cache else None
        self.last_request_time = 0
        self.album_enrichment_stats = {'enriched': 0, 'not_found': 0}

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
                if response.status_code == 200:
                    return response.json()
                elif response.status_code in DISCOGS_PERMANENT_ERRORS:
                    if response.status_code == 401:
                        logger.error("   → Vérifiez votre DISCOGS_TOKEN dans .env")
                    return None
                elif response.status_code in DISCOGS_TEMPORARY_ERRORS:
                    self.rate_limited_count += 1
                    if response.status_code == 429:
                        retry_after = int(response.headers.get('Retry-After', 60))
                        time.sleep(retry_after)
                    else:
                        time.sleep(5 * (attempt + 1))
                    continue
                else:
                    return None
            except requests.RequestException as e:
                logger.error(f"❌ Discogs - Exception réseau: {e}")
                time.sleep(2 * (attempt + 1))
        return None

    def search_artist(self, artist_name: str):
        clean_name = artist_name.strip()
        result = self._request('database/search', {'q': clean_name, 'type': 'artist', 'per_page': 1})
        if not result:
            return None
        results = result.get('results', [])
        if not results:
            return None
        first_result = results[0]
        title = first_result.get('title', '').lower()
        if clean_name.lower() not in title and title not in clean_name.lower():
            result = self._request('database/search', {'q': clean_name, 'type': 'artist', 'per_page': 3})
            if result:
                for r in result.get('results', []):
                    r_title = r.get('title', '').lower()
                    if clean_name.lower() in r_title or r_title in clean_name.lower():
                        return r
        return first_result

    def get_artist_releases(self, artist_id: int, limit: int = 200) -> List[Dict]:
        cache_key = f"discogs_releases:{artist_id}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached.get('releases', [])
        releases = []
        page = 1
        while True:
            result = self._request(
                f'artists/{artist_id}/releases',
                {'per_page': 100, 'page': page, 'sort': 'year', 'sort_order': 'asc'}
            )
            if not result:
                break
            page_releases = result.get('releases', [])
            if not page_releases:
                break
            releases.extend(page_releases)
            if len(page_releases) < 100:
                break
            if limit and len(releases) >= limit:
                break
            page += 1
        if self.cache and releases:
            self.cache.set(cache_key, {
                'releases': releases[:limit] if limit else releases,
                'fetched_at': datetime.now(timezone.utc).isoformat(),
                'count': len(releases[:limit] if limit else releases)
            })
        return releases[:limit] if limit else releases

    def get_release_credits(self, release_id: int):
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

    def enrich_albums_with_discogs(self, artist_name: str, lastfm_albums: List[Dict]) -> List[Dict]:
        """
        Enrichit les albums Last.fm avec year, type, image depuis Discogs.
        ✨ CORRECTION : L'URI Discogs remplace directement le champ 'uri'.
        """
        if not lastfm_albums:
            return lastfm_albums
        artist = self.search_artist(artist_name)
        if not artist:
            self.album_enrichment_stats['not_found'] += len(lastfm_albums)
            return lastfm_albums
        artist_id = artist.get('id')
        if not artist_id:
            return lastfm_albums
        discogs_releases = self.get_artist_releases(artist_id, limit=200)
        if not discogs_releases:
            return lastfm_albums
        discogs_index = {}
        for release in discogs_releases:
            title = release.get('title', '')
            if title:
                normalized_title = normalize_album_title(title)
                if normalized_title not in discogs_index:
                    discogs_index[normalized_title] = release
        enriched_count = 0
        for album in lastfm_albums:
            lastfm_title = album.get('name', '')
            if not lastfm_title:
                continue
            normalized_lastfm_title = normalize_album_title(lastfm_title)
            discogs_release = discogs_index.get(normalized_lastfm_title)
            if discogs_release:
                album['year'] = discogs_release.get('year')
                album['type'] = discogs_release.get('type', 'album')
                
                # ✨ CORRECTION : L'URI Discogs remplace directement le champ 'uri'
                release_id = discogs_release.get('id')
                release_type = discogs_release.get('type')
                if release_id and release_type:
                    album['uri'] = f"https://www.discogs.com/{release_type}/{release_id}"
                
                discogs_thumb = discogs_release.get('thumb')
                if discogs_thumb and (not album.get('image') or is_placeholder(album.get('image'))):
                    album['image'] = discogs_thumb
                    album['image_source'] = 'discogs'
                enriched_count += 1
        self.album_enrichment_stats['enriched'] += enriched_count
        self.album_enrichment_stats['not_found'] += len(lastfm_albums) - enriched_count
        return lastfm_albums

    def enrich_artist(self, artist_name: str):
        cache_key = artist_name.lower().strip()
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached
        artist = self.search_artist(artist_name)
        if not artist:
            result = {'albums': [], 'members': []}
            if self.cache:
                self.cache.set(cache_key, result)
            return result
        artist_id = artist.get('id')
        if not artist_id:
            result = {'albums': [], 'members': []}
            if self.cache:
                self.cache.set(cache_key, result)
            return result
        releases = self.get_artist_releases(artist_id, limit=10)
        albums = []
        for release in releases:
            if release.get('type', '').lower() in ['album', 'master']:
                release_id = release.get('id')
                release_type = release.get('type')
                discogs_uri = None
                if release_id and release_type:
                    discogs_uri = f"https://www.discogs.com/{release_type}/{release_id}"
                albums.append({
                    'title': release.get('title'),
                    'year': release.get('year'),
                    'type': release.get('type'),
                    'uri': discogs_uri,
                    'url': discogs_uri,
                    'cover_image': release.get('thumb'),
                })
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
        result = {'albums': albums, 'members': members[:10], 'discogs_id': artist_id, 'discogs_uri': artist.get('uri')}
        if self.cache:
            self.cache.set(cache_key, result)
        return result

    def save_cache(self):
        if self.cache:
            self.cache.save()

    @property
    def stats(self):
        stats = {
            'api_requests': self.request_count,
            'rate_limited': self.rate_limited_count,
            'albums_enriched': self.album_enrichment_stats.get('enriched', 0),
            'albums_not_found': self.album_enrichment_stats.get('not_found', 0),
        }
        if self.cache:
            stats['cache_size'] = self.cache.stats()['size']
        return stats

# ═══════════════════════════════════════════════════════════
# UTILITAIRES DE TRAITEMENT
# ═══════════════════════════════════════════════════════════

def clean_biography(bio_content: str) -> str:
    if not bio_content:
        return ''
    clean = re.sub(r'<[^>]+>', '', bio_content)
    clean = re.sub(r'\s*(?:Read more|Lire la suite|Mehr lesen|Más información|Leggi tutto).*$', '',
                   clean, flags=re.IGNORECASE | re.DOTALL)
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
# FILTRAGE DES GROUPES PAR LISTENERS
# ═══════════════════════════════════════════════════════════

def filter_bands_by_listeners(bands: List[Dict], min_listeners: int) -> Tuple[List[Dict], Dict]:
    if min_listeners <= 0:
        return bands, {'total_before': len(bands), 'total_after': len(bands), 'removed': 0, 'min_listeners': min_listeners}
    filtered_bands = []
    removed_count = 0
    for band in bands:
        listeners = band.get('listeners', 0) or 0
        if listeners >= min_listeners:
            filtered_bands.append(band)
        else:
            removed_count += 1
    stats = {'total_before': len(bands), 'total_after': len(filtered_bands), 'removed': removed_count, 'min_listeners': min_listeners}
    return filtered_bands, stats

# ═══════════════════════════════════════════════════════════
# STATISTIQUES
# ═══════════════════════════════════════════════════════════

def print_artist_statistics(bands: List[Dict]):
    if not bands:
        print("\n⚠️  Aucun artiste à analyser")
        return
    total = len(bands)
    print("\n" + "=" * 80)
    print(f"📊 STATISTIQUES DÉTAILLÉES DES ARTISTES RÉCUPÉRÉS ({total:,} artistes)")
    print("=" * 80)
    fields_to_check = [
        ('name', lambda b: bool(b.get('name'))),
        ('genre', lambda b: bool(b.get('genre'))),
        ('country', lambda b: bool(b.get('country')) and b.get('country') != 'Unknown'),
        ('formed', lambda b: b.get('formed') is not None),
        ('formed_date', lambda b: bool(b.get('formed_date'))),
        ('disbanded_date', lambda b: bool(b.get('disbanded_date'))),
        ('status', lambda b: bool(b.get('status'))),
        ('biography', lambda b: bool(b.get('biography'))),
        ('bio_lang', lambda b: bool(b.get('bio_lang')) and b.get('bio_lang') != 'none'),
        ('image_url', lambda b: bool(b.get('image_url'))),
        ('listeners', lambda b: b.get('listeners') is not None and b.get('listeners') > 0),
        ('mbid', lambda b: bool(b.get('mbid'))),
        ('original_name', lambda b: bool(b.get('original_name'))),
        ('rating', lambda b: b.get('rating') is not None),
        ('rating_votes', lambda b: b.get('rating_votes') is not None and b.get('rating_votes') > 0),
        ('discogs_id', lambda b: b.get('discogs_id') is not None),
        ('discogs_uri', lambda b: bool(b.get('discogs_uri'))),
        ('albums', lambda b: bool(b.get('albums'))),
        ('members', lambda b: bool(b.get('members'))),
    ]
    print(f"\n   {'Champ':<20} {'Remplis':<12} {'Taux':<10} {'Barre'}")
    print("   " + "─" * 70)
    for field_name, check_func in fields_to_check:
        count = sum(1 for b in bands if check_func(b))
        percentage = (count / total * 100) if total > 0 else 0
        bar_length = int(percentage / 5)
        bar = "█" * bar_length + "░" * (20 - bar_length)
        print(f"   {field_name:<20} {count:>8,}     {percentage:>6.1f}%   {bar}")
    listeners_list = [b.get('listeners', 0) or 0 for b in bands if b.get('listeners')]
    if listeners_list:
        print(f"\n   👂 Listeners :")
        print(f"      Min      : {min(listeners_list):>12,}")
        print(f"      Max      : {max(listeners_list):>12,}")
        print(f"      Moyenne  : {sum(listeners_list) // len(listeners_list):>12,}")
    print("\n" + "=" * 80)

def print_album_statistics(bands: List[Dict]):
    all_albums = []
    for band in bands:
        band_name = band.get('name', 'Unknown')
        albums_source = band.get('albums_source', 'none')
        for album in band.get('albums', []):
            album_copy = album.copy()
            album_copy['_band_name'] = band_name
            album_copy['_albums_source'] = albums_source
            all_albums.append(album_copy)
    if not all_albums:
        print("\n⚠️  Aucun album à analyser")
        return
    total = len(all_albums)
    print("\n" + "=" * 80)
    print(f"💿 STATISTIQUES DÉTAILLÉES DES ALBUMS RÉCUPÉRÉS ({total:,} albums)")
    print("=" * 80)
    fields_to_check = [
        ('title', lambda a: bool(a.get('name') or a.get('title'))),
        ('artist', lambda a: bool(a.get('artist'))),
        ('year', lambda a: a.get('year') is not None),
        ('image_url', lambda a: bool(a.get('image') or a.get('cover_image'))),
        ('mbid', lambda a: bool(a.get('mbid'))),
        ('url', lambda a: bool(a.get('url'))),
        ('playcount', lambda a: a.get('playcount') is not None and _safe_int(a.get('playcount'), 0) > 0),
        ('release_type', lambda a: bool(a.get('type') or a.get('release_type'))),
        ('uri', lambda a: bool(a.get('uri'))),
    ]
    print(f"\n   {'Champ':<20} {'Remplis':<12} {'Taux':<10} {'Barre'}")
    print("   " + "─" * 70)
    for field_name, check_func in fields_to_check:
        count = sum(1 for a in all_albums if check_func(a))
        percentage = (count / total * 100) if total > 0 else 0
        bar_length = int(percentage / 5)
        bar = "█" * bar_length + "░" * (20 - bar_length)
        print(f"   {field_name:<20} {count:>8,}     {percentage:>6.1f}%   {bar}")
    print("\n" + "=" * 80)

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
# FILTRAGE DES ALBUMS PAR TYPE AVEC LIMITATION PAR ARTISTE
# ═══════════════════════════════════════════════════════════

def filter_albums_by_type(bands: List[Dict], album_type: str, max_per_band: Optional[int] = None) -> Tuple[List[Dict], Dict]:
    stats = {'total_albums_before': 0, 'total_albums_after': 0, 'albums_removed': 0, 'bands_affected': 0, 'bands_empty_after_filter': 0}
    filtered_bands = []
    for band in bands:
        albums = band.get('albums', [])
        stats['total_albums_before'] += len(albums)
        filtered_albums = [a for a in albums if a.get('type') == album_type]
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

# ═══════════════════════════════════════════════════════════
# MISE À JOUR DES DONNÉES EXISTANTES (--update-from)
# ═══════════════════════════════════════════════════════════

def update_bands_from_file(file_path: str, fields: Optional[List[str]] = None,
                           insecure: bool = False, proxy: Optional[str] = None,
                           use_musicbrainz: bool = True,
                           use_discogs: bool = True,
                           max_albums_per_band: int = 5,
                           preloaded_bands: Optional[List[Dict]] = None) -> Tuple[List[Dict], Dict]:
    if preloaded_bands is not None:
        bands = preloaded_bands
    else:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            bands = data
        elif isinstance(data, dict) and 'bands' in data:
            bands = data['bands']
        else:
            raise ValueError("Format de fichier inconnu")

    if fields:
        update_fields = set(field.strip() for field in fields if field.strip())
    else:
        update_fields = {'country', 'formed', 'formed_date', 'status', 'disbanded_date',
                         'rating', 'rating_votes', 'albums', 'members', 'mbid', 'album_mbid',
                         'image_url', 'original_name'}

    musicbrainz_fields = {'country', 'formed', 'formed_date', 'status', 'disbanded_date', 'rating', 'rating_votes'}
    if not use_musicbrainz:
        update_fields = update_fields - musicbrainz_fields - {'mbid', 'album_mbid', 'image_url'}
        if not update_fields:
            return bands, {'total_groups': len(bands), 'groups_updated': 0,
                           'fields': {}, 'total_albums_added': 0, 'total_members_added': 0,
                           'total_albums_mbid_added': 0}

    lastfm_client = LastFmClient(LASTFM_API_KEY, insecure=insecure, proxy=proxy)
    musicbrainz_client = MusicBrainzClient(mb_delay=DEFAULT_MB_DELAY, use_cache=True, proxy=proxy) if use_musicbrainz else None
    discogs_client = DiscogsClient(token=DISCOGS_TOKEN, use_cache=True, proxy=proxy) if use_discogs else None
    coverart_client = CoverArtArchiveClient(use_cache=True, proxy=proxy)

    stats = {
        'total_groups': len(bands),
        'groups_updated': 0,
        'fields': {field: 0 for field in update_fields},
        'total_albums_added': 0,
        'total_members_added': 0,
        'total_albums_mbid_added': 0,
    }

    updated_bands = []
    for band in tqdm(bands, desc="Mise à jour"):
        name = band.get('name')
        mbid = band.get('mbid')
        changed = False

        missing = []
        if 'mbid' in update_fields and not band.get('mbid'):
            missing.append('mbid')
        if 'image_url' in update_fields and not band.get('image_url'):
            missing.append('image_url')
        if 'original_name' in update_fields and not band.get('original_name'):
            missing.append('original_name')
        if 'album_mbid' in update_fields:
            albums_without_mbid = [
                album for album in band.get('albums', [])
                if not album.get('mbid') and (album.get('name') or album.get('title'))
            ]
            if albums_without_mbid:
                missing.append('album_mbid')
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

        if 'mbid' in missing and name and musicbrainz_client:
            found_mbid = musicbrainz_client.search_artist_mbid(name)
            if found_mbid:
                band['mbid'] = found_mbid
                stats['fields']['mbid'] = stats['fields'].get('mbid', 0) + 1
                changed = True
                mbid = found_mbid

        if 'image_url' in missing and mbid and musicbrainz_client:
            found_image = musicbrainz_client.get_artist_image(mbid)
            if found_image:
                band['image_url'] = found_image
                band['image_source'] = 'musicbrainz+wikimedia-commons'
                stats['fields']['image_url'] = stats['fields'].get('image_url', 0) + 1
                changed = True
                logger.info(f"🖼️  Image trouvée pour '{name}'")

        if 'original_name' in missing and name:
            match = re.match(r'^(.+?)\s*\(([^)]+)\)\s*$', name)
            if match:
                potential_original_name = match.group(1).strip()
                country_in_parens = match.group(2).strip()
                known_countries = set(ISO_TO_COUNTRY.values())
                known_countries.add('Unknown')
                is_country = False
                for country in known_countries:
                    if country.lower() == country_in_parens.lower():
                        is_country = True
                        break
                    if country_in_parens.lower().startswith(country.lower()):
                        is_country = True
                        break
                if is_country and potential_original_name:
                    band['original_name'] = potential_original_name
                    stats['fields']['original_name'] = stats['fields'].get('original_name', 0) + 1
                    changed = True
                    logger.info(f"📝 original_name extrait pour '{name}': '{potential_original_name}'")

        if 'album_mbid' in missing and musicbrainz_client:
            albums = band.get('albums', [])
            albums_enriched = 0
            albums_to_process = [
                album for album in albums
                if not album.get('mbid') and (album.get('name') or album.get('title'))
            ][:max_albums_per_band]
            for album in albums_to_process:
                album_title = album.get('name') or album.get('title')
                album_artist = album.get('artist') or name
                if not album_title:
                    continue
                found_mbid = musicbrainz_client.search_release_group_mbid(album_title, album_artist)
                if found_mbid:
                    album['mbid'] = found_mbid
                    albums_enriched += 1
            if albums_enriched > 0:
                stats['fields']['album_mbid'] = stats['fields'].get('album_mbid', 0) + albums_enriched
                stats['total_albums_mbid_added'] = stats.get('total_albums_mbid_added', 0) + albums_enriched
                changed = True
                logger.info(f"🎵 {albums_enriched}/{len(albums_to_process)} albums enrichis avec MBID pour '{name}'")

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

        if 'albums' in missing and name:
            lastfm_albums = lastfm_client.get_artist_albums(name, limit=100)
            if lastfm_albums and (not band.get('albums') or len(band.get('albums', [])) == 0):
                band['albums'] = lastfm_albums
                band['albums_source'] = 'lastfm'
                stats['fields']['albums'] += 1
                stats['total_albums_added'] += len(lastfm_albums)
                changed = True

        if discogs_client and any(f in missing for f in ['albums', 'members']) and name:
            discogs_data = discogs_client.enrich_artist(name)
            if discogs_data:
                if 'albums' in missing and discogs_data.get('albums') and (not band.get('albums') or len(band.get('albums', [])) == 0):
                    band['albums'] = discogs_data['albums']
                    band['albums_source'] = 'discogs'
                    stats['fields']['albums'] += 1
                    stats['total_albums_added'] += len(discogs_data['albums'])
                    changed = True
                if 'members' in missing and discogs_data.get('members') and (not band.get('members') or len(band.get('members', [])) == 0):
                    band['members'] = discogs_data['members']
                    stats['fields']['members'] += 1
                    stats['total_members_added'] += len(discogs_data['members'])
                    changed = True

        if band.get('albums') and coverart_client:
            for album in band['albums'][:max_albums_per_band]:
                if not album.get('image') and not album.get('cover_image') and album.get('mbid'):
                    cover_url = coverart_client.get_cover_for_album(album['mbid'])
                    if cover_url:
                        album['image'] = cover_url
                        album['image_source'] = 'coverartarchive'

        if changed:
            stats['groups_updated'] += 1

        updated_bands.append(band)

    lastfm_client.save_cache()
    if musicbrainz_client:
        musicbrainz_client.save_cache()
    if discogs_client:
        discogs_client.save_cache()
    coverart_client.save_cache()

    return updated_bands, stats

# ═══════════════════════════════════════════════════════════
# TRAITEMENT D'UN ARTISTE
# ═══════════════════════════════════════════════════════════

def process_artist(artist_data: Dict, source_tag: str, bio_lang: str,
                   lastfm_client: Optional[LastFmClient] = None,
                   musicbrainz_client: Optional[MusicBrainzClient] = None,
                   discogs_client: Optional[DiscogsClient] = None,
                   coverart_client: Optional[CoverArtArchiveClient] = None) -> Optional[Dict]:
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
    image_url = pick_best_lastfm_image(images)
    image_source = None
    if image_url:
        image_source = 'lastfm:artist.getInfo'
        if lastfm_client:
            lastfm_client.image_stats['lastfm_info'] += 1
    else:
        if lastfm_client:
            lastfm_client.image_stats['placeholder_filtered'] += 1
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
    albums = []
    albums_source = None
    if lastfm_client and name:
        albums = lastfm_client.get_artist_albums(name, limit=100, max_pages=3)
        if albums:
            albums_source = 'lastfm'
    discogs_data = None
    mb_members = []
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
        if not image_url:
            image_url = musicbrainz_client.get_artist_image(mbid)
            if image_url:
                image_source = 'musicbrainz+wikimedia-commons'
        mb_members = musicbrainz_client.extract_members(mbid)
    if discogs_client and albums and albums_source == 'lastfm':
        albums = discogs_client.enrich_albums_with_discogs(name, albums)
    if discogs_client and name:
        cache_key = name.lower().strip()
        cached = discogs_client.cache.get(cache_key) if discogs_client.cache else None
        if cached:
            discogs_data = cached
        else:
            discogs_data = discogs_client.enrich_artist(name)
            if discogs_client.cache:
                discogs_client.cache.set(cache_key, discogs_data)
        if not albums and discogs_data and discogs_data.get('albums'):
            albums = discogs_data['albums']
            albums_source = 'discogs'
    if discogs_client and name:
        discogs_members = discogs_data.get('members', []) if discogs_data else []
        all_members = mb_members + [m for m in discogs_members
                                     if m['name'] not in [mb['name'] for mb in mb_members]]
    else:
        all_members = mb_members if musicbrainz_client and mbid else []
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
        'image_source': image_source,
        'listeners': listeners,
        'albums': albums,
        'albums_source': albums_source,
        'members': all_members,
        'source_tag': source_tag,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
    }
    if discogs_data:
        result['discogs_id'] = discogs_data.get('discogs_id')
        result['discogs_uri'] = discogs_data.get('discogs_uri')
    if not image_url and lastfm_client:
        lastfm_client.image_stats['no_image'] += 1
    return result

# ═══════════════════════════════════════════════════════════
# FONCTION PRINCIPALE DE RÉCUPÉRATION
# ═══════════════════════════════════════════════════════════

def fetch_all_metal_bands(limit: int, resume: bool, progress_path: str,
                          preferred_lang: str, use_musicbrainz: bool,
                          mb_delay: float, use_discogs: bool,
                          min_listeners: int = 0,
                          insecure: bool = False, proxy: Optional[str] = None):
    if not LASTFM_API_KEY:
        logger.error("❌ Erreur: LASTFM_API_KEY non définie dans .env")
        return [], {}, {}, {}, {}, {}
    logger.info("🎸 Démarrage de la récupération des groupes metal")
    logger.info(f"📊 Limite: {limit} groupes")
    logger.info(f"🌍 Langue: {preferred_lang.upper()}")
    if min_listeners > 0:
        logger.info(f"🔍 Filtre listeners: minimum {min_listeners:,}")
    lastfm_client = LastFmClient(LASTFM_API_KEY, default_lang=preferred_lang, insecure=insecure, proxy=proxy)
    musicbrainz_client = MusicBrainzClient(mb_delay=mb_delay, use_cache=use_musicbrainz, proxy=proxy) if use_musicbrainz else None
    discogs_client = DiscogsClient(token=DISCOGS_TOKEN, use_cache=use_discogs, proxy=proxy) if use_discogs else None
    coverart_client = CoverArtArchiveClient(use_cache=True, proxy=proxy)
    if resume:
        progress = load_progress(progress_path)
        seen_names = set(progress.get('seen_names', []))
        bands_list = progress.get('bands', [])
        start_tag_idx = progress.get('last_tag_index', 0)
        start_page = progress.get('last_page', 1)
        logger.info(f"🔄 Reprise depuis le tag {start_tag_idx}, page {start_page}")
    else:
        progress = {'seen_names': [], 'bands': [], 'last_tag_index': 0, 'last_page': 1}
        seen_names, bands_list = set(), []
        start_tag_idx, start_page = 0, 1
    logger.info(f"📊 {len(METAL_TAGS)} sous-genres à parcourir")
    if use_musicbrainz:
        logger.info(f"🎵 MusicBrainz: ACTIVÉ (délai: {mb_delay}s)")
    else:
        logger.info("⏭️  MusicBrainz: DÉSACTIVÉ")
    if use_discogs:
        token_status = "AVEC token" if DISCOGS_TOKEN else "SANS token"
        logger.info(f"💿 Discogs: ACTIVÉ ({token_status})")
    else:
        logger.info("⏭️  Discogs: DÉSACTIVÉ")
    for tag_idx, tag in enumerate(tqdm(METAL_TAGS[start_tag_idx:], desc="Genres", initial=start_tag_idx)):
        actual_tag_idx = start_tag_idx + tag_idx
        page = start_page if tag_idx == 0 else 1
        while len(bands_list) < limit:
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
                artist_info, actual_lang = lastfm_client.get_artist_info_with_fallback(artist_name, preferred_lang, 'en')
                if artist_info:
                    lastfm_client.bio_stats[f'bio_{preferred_lang}' if actual_lang == preferred_lang else ('bio_en' if actual_lang == 'en' else 'bio_none')] += 1
                    processed = process_artist(artist_info, tag, actual_lang, lastfm_client, musicbrainz_client, discogs_client, coverart_client)
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
    
    if min_listeners > 0 and bands_list:
        logger.info(f"🔍 Filtrage par listeners: minimum {min_listeners:,}")
        bands_list, filter_stats = filter_bands_by_listeners(bands_list, min_listeners)
        logger.info(f"   Groupes avant filtrage : {filter_stats['total_before']:,}")
        logger.info(f"   Groupes après filtrage : {filter_stats['total_after']:,}")
        logger.info(f"   Groupes supprimés      : {filter_stats['removed']:,}")
    
    lastfm_client.save_cache()
    if musicbrainz_client:
        musicbrainz_client.save_cache()
    if discogs_client:
        discogs_client.save_cache()
    coverart_client.save_cache()
    logger.info(f"✅ Récupération terminée: {len(bands_list)} groupes")
    
    if musicbrainz_client:
        logger.info(f"\n📊 STATISTIQUES DE RÉSOLUTION DU PAYS:")
        logger.info(f"   Résolus directement (code ISO) : {musicbrainz_client.country_stats.get('resolved_direct', 0):,}")
        logger.info(f"   Résolus par hiérarchie          : {musicbrainz_client.country_stats.get('resolved_hierarchy', 0):,}")
        logger.info(f"   Non résolus                      : {musicbrainz_client.country_stats.get('unresolved', 0):,}")
    
    if discogs_client:
        total = discogs_client.album_enrichment_stats.get('total', 0)
        enriched = discogs_client.album_enrichment_stats.get('enriched', 0)
        not_found = discogs_client.album_enrichment_stats.get('not_found', 0)
        rate = (enriched / total * 100) if total > 0 else 0
        logger.info(f"\n📊 STATISTIQUES D'ENRICHISSEMENT DISCOGS:")
        logger.info(f"   Albums totaux traités : {total:,}")
        logger.info(f"   Albums enrichis       : {enriched:,} ({rate:.1f}%)")
        logger.info(f"   Albums non trouvés    : {not_found:,}")
    
    print_artist_statistics(bands_list)
    print_album_statistics(bands_list)
    return (bands_list,
            lastfm_client.stats,
            musicbrainz_client.stats if musicbrainz_client else {},
            discogs_client.stats if discogs_client else {},
            lastfm_client.album_stats,
            coverart_client.stats)

# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Récupère des groupes metal via Last.fm + MusicBrainz + Discogs',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
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
    parser.add_argument('--log-level', type=str, default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    parser.add_argument('--no-log-file', action='store_true')
    parser.add_argument('--output', type=str, default=None)
    parser.add_argument('--proxy', type=str, default=None)
    parser.add_argument('--update-from', type=str, default=None)
    parser.add_argument('--update-fields', type=str, default=None)
    parser.add_argument('--max-albums-per-band', type=int, default=5)
    parser.add_argument('--filter-album-type', type=str, default=None)
    parser.add_argument('--min-listeners', type=int, default=0,
                        help='Nombre minimum de listeners Last.fm pour inclure un groupe (défaut: 0)')
    args = parser.parse_args()

    log_file = None if args.no_log_file else LOG_FILE
    setup_logging(args.log_level, log_file)

    logger.info("=" * 80)
    logger.info("🚀 METAL FETCHER - Démarrage")
    logger.info("=" * 80)

    proxy = args.proxy or os.getenv('HTTP_PROXY') or os.getenv('HTTPS_PROXY')
    if proxy:
        logger.info(f"🌐 Proxy utilisé: {proxy}")

    if args.test:
        success = test_services(insecure=args.insecure, proxy=proxy)
        sys.exit(0 if success else 1)

    if args.reset:
        reset_progress(PROGRESS_FILE)
    if args.clear_mb_cache:
        Path(MB_CACHE_FILE).unlink(missing_ok=True)
        logger.info("🗑️  Cache MusicBrainz vidé")
    if args.clear_discogs_cache:
        Path(DISCOGS_CACHE_FILE).unlink(missing_ok=True)
        logger.info("🗑️  Cache Discogs vidé")
    if args.clear_lastfm_cache:
        Path(LASTFM_CACHE_FILE).unlink(missing_ok=True)
        logger.info("🗑️  Cache Last.fm vidé")
    if args.clear_caa_cache:
        Path(CAA_CACHE_FILE).unlink(missing_ok=True)
        logger.info("🗑️  Cache Cover Art Archive vidé")
    if args.clear_albums_cache:
        for cache_file in [LASTFM_CACHE_FILE, DISCOGS_CACHE_FILE]:
            if cache_file and Path(cache_file).exists():
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache = json.load(f)
                    original_size = len(cache)
                    cache = {k: v for k, v in cache.items()
                             if not k.startswith('albums:') and not k.startswith('discogs_releases:')}
                    with open(cache_file, 'w', encoding='utf-8') as f:
                        json.dump(cache, f, ensure_ascii=False)
                    removed = original_size - len(cache)
                    logger.info(f"🗑️  Cache albums vidé: {removed} entrées supprimées")
                except Exception as e:
                    logger.error(f"❌ Erreur lors du vidage du cache albums: {e}")

    if args.update_from:
        logger.info(f"🔄 Mise à jour du fichier {args.update_from}...")
        update_fields = args.update_fields.split(',') if args.update_fields else None
        
        with open(args.update_from, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, list):
            bands = data
        elif isinstance(data, dict) and 'bands' in data:
            bands = data['bands']
        else:
            logger.error("❌ Format de fichier inconnu")
            sys.exit(1)
        
        if args.min_listeners > 0:
            logger.info(f"🔍 Filtrage par listeners: minimum {args.min_listeners:,}")
            bands, filter_stats = filter_bands_by_listeners(bands, args.min_listeners)
            logger.info(f"   Groupes avant filtrage : {filter_stats['total_before']:,}")
            logger.info(f"   Groupes après filtrage : {filter_stats['total_after']:,}")
            logger.info(f"   Groupes supprimés      : {filter_stats['removed']:,}")
        
        try:
            updated_bands, update_stats = update_bands_from_file(
                args.update_from,
                fields=update_fields,
                insecure=args.insecure,
                proxy=proxy,
                use_musicbrainz=not args.skip_musicbrainz,
                use_discogs=args.with_discogs,
                max_albums_per_band=args.max_albums_per_band,
                preloaded_bands=bands,
            )
            
            # Appliquer le filtre APRÈS l'enrichissement
            if args.filter_album_type:
                logger.info(f"🔍 Filtrage des albums par type: '{args.filter_album_type}' (max {args.max_albums_per_band} par artiste)...")
                updated_bands, filter_stats = filter_albums_by_type(
                    updated_bands,
                    args.filter_album_type,
                    max_per_band=args.max_albums_per_band
                )
                logger.info(f"   Albums avant filtrage : {filter_stats['total_albums_before']:,}")
                logger.info(f"   Albums après filtrage : {filter_stats['total_albums_after']:,}")
                logger.info(f"   Albums supprimés      : {filter_stats['albums_removed']:,}")
                logger.info(f"   Groupes affectés      : {filter_stats['bands_affected']:,}")
                logger.info(f"   Groupes vides après   : {filter_stats['bands_empty_after_filter']:,}")
            
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
            else:
                output_path = generate_output_filename('metal_bands_updated', '../data')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump({'bands': updated_bands}, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ Fichier mis à jour sauvegardé dans {output_path}")
            logger.info(f"   Groupes traités : {update_stats['total_groups']}")
            logger.info(f"   Groupes mis à jour : {update_stats['groups_updated']}")
            logger.info(f"   Albums ajoutés : {update_stats['total_albums_added']}")
            logger.info(f"   Membres ajoutés : {update_stats['total_members_added']}")
            logger.info(f"   MBID artistes ajoutés : {update_stats['fields'].get('mbid', 0)}")
            logger.info(f"   MBID albums ajoutés : {update_stats.get('total_albums_mbid_added', 0)}")
            logger.info(f"   Images ajoutées : {update_stats['fields'].get('image_url', 0)}")
            logger.info(f"   Original names extraits : {update_stats['fields'].get('original_name', 0)}")
            print_artist_statistics(updated_bands)
            print_album_statistics(updated_bands)
            sys.exit(0)
        except Exception as e:
            logger.error(f"❌ Erreur lors de la mise à jour: {e}", exc_info=True)
            sys.exit(1)

    try:
        bands, lastfm_stats, mb_stats, discogs_stats, album_stats, caa_stats = fetch_all_metal_bands(
            limit=args.limit,
            resume=args.resume,
            progress_path=PROGRESS_FILE,
            preferred_lang=args.lang,
            use_musicbrainz=not args.skip_musicbrainz,
            mb_delay=args.mb_delay,
            use_discogs=args.with_discogs,
            min_listeners=args.min_listeners,
            insecure=args.insecure,
            proxy=proxy
        )
        
        # Appliquer le filtre APRÈS l'enrichissement
        if args.filter_album_type and bands:
            logger.info(f"🔍 Filtrage des albums par type: '{args.filter_album_type}' (max {args.max_albums_per_band} par artiste)...")
            bands, filter_stats = filter_albums_by_type(
                bands,
                args.filter_album_type,
                max_per_band=args.max_albums_per_band
            )
            logger.info(f"   Albums avant filtrage : {filter_stats['total_albums_before']:,}")
            logger.info(f"   Albums après filtrage : {filter_stats['total_albums_after']:,}")
            logger.info(f"   Albums supprimés      : {filter_stats['albums_removed']:,}")
            logger.info(f"   Groupes affectés      : {filter_stats['bands_affected']:,}")
            logger.info(f"   Groupes vides après   : {filter_stats['bands_empty_after_filter']:,}")
        
        if bands:
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
            else:
                output_path = generate_output_filename('metal_bands', '../data')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump({'bands': bands}, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ {len(bands)} groupes sauvegardés dans {output_path}")
        else:
            logger.warning("⚠️  Aucun groupe récupéré")
    except KeyboardInterrupt:
        logger.warning("⚠️  Interruption par l'utilisateur (Ctrl+C)")
        logger.info("💡 Utilisez --resume pour reprendre plus tard")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
