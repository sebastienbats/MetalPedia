#!/usr/bin/env python3
"""
Importe les groupes metal vers Supabase avec :
- Gestion robuste des doublons (hash stable + contrainte UNIQUE)
- Normalisation des genres, pays, langues, dates et sources
- ✨ Mapping intelligent des genres vers les 9 piliers du metal (genre_pillar)
- Checkpoint pour reprise sur interruption
- Filtrage par popularité (listeners)
- Résolution des homonymes
- Support des champs MusicBrainz (mbid, formed_date, disbanded_date, country_source, formed_source)
- Import complet des albums (Last.fm + Discogs + Cover Art Archive) avec image_source
- Import des membres (MusicBrainz + Discogs) avec dates d'adhésion et statut actif
- Support des formats JSON : {"bands": [...]} et tableau direct
- ✨ Vidage des tables albums/members/bands par lots (évite le timeout)
- ✨ Récupération des IDs existants des bands (évite de changer les IDs référencés)
- ✨ Upsert avec on_conflict='name' pour bands (contrainte UNIQUE sur name)
- ✨ Déduplication robuste des albums (par ID ET par band_id+title)
- ✨ Logging détaillé des erreurs

Usage:
  python import_to_supabase.py                                  # Import standard
  python import_to_supabase.py --min-listeners 1000            # Qualité élevée
  python import_to_supabase.py --dry-run                       # Test sans import
  python import_to_supabase.py --reset-checkpoint              # Reprendre depuis 0
  python import_to_supabase.py --stats-only                    # Juste les stats
  python import_to_supabase.py --skip-albums --skip-members    # Groupes uniquement
  python import_to_supabase.py --truncate-before-import        # TRUNCATE au lieu de DELETE
  python import_to_supabase.py --truncate-bands                # Tronque aussi la table bands
"""

import os
import re
import json
import time
import hashlib
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from datetime import datetime, timezone
from tqdm import tqdm
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(Path(__file__).parent.parent / '.env')

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
DEFAULT_INPUT = '../data/metal_bands.json'
DEFAULT_BATCH_SIZE = 50
DEFAULT_MIN_LISTENERS = 0
CHECKPOINT_FILE = '../data/import_checkpoint.json'

# Taille des lots pour le vidage des tables (évite le timeout)
PURGE_BATCH_SIZE = 10000

# ═══════════════════════════════════════════════════════════
# CONSTANTES DE VALIDATION
# ═══════════════════════════════════════════════════════════

VALID_STATUSES = {'Active', 'On hold', 'Split-up', 'Unknown', 'Changed name', 'Disputed', 'Vacation'}
VALID_BIO_LANGS = {'fr', 'en', 'de', 'es', 'it', 'pl', 'pt', 'ru', 'sv', 'ja', 'zh', 'none'}
VALID_COUNTRY_SOURCES = {'musicbrainz', 'lastfm_tags', 'unknown'}
VALID_FORMED_SOURCES = {'musicbrainz', 'unknown'}
VALID_ALBUM_SOURCES = {'lastfm', 'discogs'}
VALID_MEMBER_SOURCES = {'musicbrainz', 'discogs'}
VALID_IMAGE_SOURCES = {
    'lastfm:artist.getInfo', 'lastfm:artist.getImages',
    'musicbrainz+wikimedia-commons', 'lastfm', 'discogs', 'coverartarchive',
}

# ═══════════════════════════════════════════════════════════
# NORMALISATION DES GENRES
# ═══════════════════════════════════════════════════════════

GENRE_NORMALIZATION: Dict[str, str] = {
    'Melodic Death Metal': 'Death Metal',
    'Brutal Death Metal': 'Death Metal',
    'Technical Death Metal': 'Death Metal',
    'Swedish Death Metal': 'Death Metal',
    'Finnish Death Metal': 'Death Metal',
    'Norwegian Black Metal': 'Black Metal',
    'Symphonic Black Metal': 'Black Metal',
    'Melodic Black Metal': 'Black Metal',
    'Viking Metal': 'Folk Metal',
    'Pagan Metal': 'Folk Metal',
    'Metallic Hardcore': 'Metalcore',
    'Math Metal': 'Progressive Metal',
    'Speed Metal': 'Thrash Metal',
    'Crossover Thrash': 'Thrash Metal',
    'Teutonic Thrash': 'Thrash Metal',
    'Thrash': 'Thrash Metal',
    'Epic Metal': 'Power Metal',
    'True Metal': 'Heavy Metal',
    'Post-Metal': 'Progressive Metal',
    'Djent': 'Progressive Metal',
}

VALID_TYPESCRIPT_GENRES = {
    'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal',
    'Power Metal', 'Doom Metal', 'Progressive Metal', 'Folk Metal',
    'Symphonic Metal', 'Gothic Metal', 'Nu Metal', 'Metalcore',
    'Sludge Metal', 'Stoner Metal', 'Groove Metal',
}

# ═══════════════════════════════════════════════════════════
# ✨ MAPPING DES GENRES VERS LES 9 PILIERS DU METAL
# ═══════════════════════════════════════════════════════════

GENRE_PILLARS = {
    'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal',
    'Power Metal', 'Doom Metal', 'Progressive Metal', 'Folk Metal',
    'Metalcore',
}

# Mapping intelligent : genre normalisé → pilier
GENRE_PILLAR_MAPPING: Dict[str, str] = {
    # Piliers directs
    'Black Metal': 'Black Metal',
    'Death Metal': 'Death Metal',
    'Heavy Metal': 'Heavy Metal',
    'Thrash Metal': 'Thrash Metal',
    'Power Metal': 'Power Metal',
    'Doom Metal': 'Doom Metal',
    'Progressive Metal': 'Progressive Metal',
    'Folk Metal': 'Folk Metal',
    'Metalcore': 'Metalcore',
    # Sous-genres → piliers
    'Symphonic Metal': 'Power Metal',       # Symphonique ≈ Power metal symphonique
    'Gothic Metal': 'Doom Metal',           # Gothic ≈ Doom/Atmosphérique
    'Nu Metal': 'Metalcore',                # Nu Metal ≈ Metal alternatif/Metalcore
    'Sludge Metal': 'Doom Metal',           # Sludge = sous-genre du Doom
    'Stoner Metal': 'Doom Metal',           # Stoner ≈ Doom/Stoner
    'Groove Metal': 'Thrash Metal',         # Groove = évolution du Thrash
    'Metal': 'Heavy Metal',                 # "Metal" générique → Heavy Metal
}


def normalize_genre(genre: str) -> str:
    if not genre:
        return 'Metal'
    if genre in GENRE_NORMALIZATION:
        return GENRE_NORMALIZATION[genre]
    if genre in VALID_TYPESCRIPT_GENRES:
        return genre
    return 'Metal'


def normalize_genre_pillar(genre: str) -> str:
    """
    ✨ Mappe un genre (même non normalisé) vers l'un des 9 piliers du metal.

    Piliers valides :
    Black Metal, Death Metal, Heavy Metal, Thrash Metal,
    Power Metal, Doom Metal, Progressive Metal, Folk Metal, Metalcore

    Logique :
    1. Normalise d'abord le genre via normalize_genre()
    2. Cherche le mapping direct dans GENRE_PILLAR_MAPPING
    3. Fallback : cherche des mots-clés dans le genre original
    4. Dernier recours : 'Heavy Metal'
    """
    if not genre:
        return 'Heavy Metal'

    # Étape 1 : Normaliser le genre
    normalized = normalize_genre(genre)

    # Étape 2 : Mapping direct
    if normalized in GENRE_PILLAR_MAPPING:
        return GENRE_PILLAR_MAPPING[normalized]

    # Étape 3 : Si c'est déjà un pilier, le retourner directement
    if normalized in GENRE_PILLARS:
        return normalized

    # Étape 4 : Fallback par mots-clés dans le genre original
    genre_lower = genre.lower()

    keyword_mapping = [
        # Black Metal
        (['black metal', 'blackened', 'blackmetal'], 'Black Metal'),
        # Death Metal
        (['death metal', 'deathmetal', 'brutal death', 'technical death',
          'melodic death', 'swedish death', 'finnish death'], 'Death Metal'),
        # Thrash Metal
        (['thrash', 'speed metal', 'crossover', 'groove metal', 'groove'], 'Thrash Metal'),
        # Power Metal
        (['power metal', 'symphonic metal', 'symphonic', 'epic metal', 'neoclassical'], 'Power Metal'),
        # Doom Metal
        (['doom', 'sludge', 'stoner', 'gothic metal', 'gothic', 'funeral'], 'Doom Metal'),
        # Progressive Metal
        (['progressive', 'prog metal', 'djent', 'math metal', 'post-metal',
          'post metal', 'avant-garde', 'experimental'], 'Progressive Metal'),
        # Folk Metal
        (['folk metal', 'folk', 'viking', 'pagan', 'celtic', 'medieval'], 'Folk Metal'),
        # Metalcore
        (['metalcore', 'nu metal', 'numetal', 'hardcore', 'metallic hardcore',
          'mathcore', 'deathcore'], 'Metalcore'),
        # Heavy Metal (le plus large, en dernier)
        (['heavy metal', 'heavy', 'traditional metal', 'nwobhm', 'true metal',
          'classic metal', 'classic'], 'Heavy Metal'),
    ]

    for keywords, pillar in keyword_mapping:
        for keyword in keywords:
            if keyword in genre_lower:
                return pillar

    # Étape 5 : Dernier recours
    return 'Heavy Metal'


# ═══════════════════════════════════════════════════════════
# NORMALISATION DES PAYS
# ═══════════════════════════════════════════════════════════

COUNTRY_NORMALIZATION: Dict[str, str] = {
    'USA': 'United States', 'US': 'United States', 'U.S.': 'United States',
    'U.S.A.': 'United States', 'United States of America': 'United States',
    'America': 'United States', 'États-Unis': 'United States',
    'UK': 'United Kingdom', 'U.K.': 'United Kingdom', 'England': 'United Kingdom',
    'Scotland': 'United Kingdom', 'Wales': 'United Kingdom',
    'Royaume-Uni': 'United Kingdom', 'Great Britain': 'United Kingdom',
    'Deutschland': 'Germany', 'Allemagne': 'Germany',
    'Sverige': 'Sweden', 'Suède': 'Sweden',
    'Norge': 'Norway', 'Norvège': 'Norway',
    'Suomi': 'Finland', 'Finlande': 'Finland',
    'Danmark': 'Denmark', 'Danemark': 'Denmark',
    'Ísland': 'Iceland', 'Island': 'Iceland',
    'France': 'France', 'España': 'Spain', 'Espagne': 'Spain',
    'Italia': 'Italy', 'Italie': 'Italy',
    'Brasil': 'Brazil', 'Brésil': 'Brazil',
    'Japan': 'Japan', 'Japon': 'Japan',
    'Canada': 'Canada', 'Australia': 'Australia', 'Australie': 'Australia',
    'The Netherlands': 'Netherlands', 'Holland': 'Netherlands',
    'Pays-Bas': 'Netherlands', 'Belgique': 'Belgium', 'Suisse': 'Switzerland',
    'Pologne': 'Poland', 'Russie': 'Russia', 'Grèce': 'Greece',
    'Portugal': 'Portugal', 'Czech Republic': 'Czechia',
    'Czech': 'Czechia', 'Česko': 'Czechia',
    'USSR': 'Russia', 'Soviet Union': 'Russia',
    'Yugoslavia': 'Serbia', 'East Germany': 'Germany',
    'West Germany': 'Germany', 'Korea': 'South Korea',
}


def normalize_country(country: Optional[str]) -> str:
    if not country:
        return 'Unknown'
    cleaned = country.strip()
    if not cleaned:
        return 'Unknown'
    if cleaned in COUNTRY_NORMALIZATION:
        return COUNTRY_NORMALIZATION[cleaned]
    lower = cleaned.lower()
    for key, value in COUNTRY_NORMALIZATION.items():
        if key.lower() == lower:
            return value
    return cleaned.title()


# ═══════════════════════════════════════════════════════════
# NORMALISATION DES SOURCES & UTILITAIRES
# ═══════════════════════════════════════════════════════════

def normalize_country_source(source: Optional[str]) -> str:
    if not source:
        return 'unknown'
    cleaned = source.strip().lower()
    return cleaned if cleaned in VALID_COUNTRY_SOURCES else 'unknown'


def normalize_formed_source(source: Optional[str]) -> str:
    if not source:
        return 'unknown'
    cleaned = source.strip().lower()
    return cleaned if cleaned in VALID_FORMED_SOURCES else 'unknown'


def normalize_bio_lang(bio_lang: Optional[str]) -> Optional[str]:
    if not bio_lang:
        return None
    cleaned = bio_lang.strip().lower()
    return cleaned if cleaned in VALID_BIO_LANGS else None


def normalize_status(status: Optional[str]) -> str:
    if not status:
        return 'Unknown'
    cleaned = status.strip()
    if cleaned.title() in VALID_STATUSES:
        return cleaned.title()
    if cleaned in VALID_STATUSES:
        return cleaned
    return 'Unknown'


def normalize_image_source(source: Optional[str]) -> Optional[str]:
    if not source:
        return None
    cleaned = source.strip().lower()
    if cleaned in {s.lower() for s in VALID_IMAGE_SOURCES}:
        return cleaned
    return None


def normalize_albums_source(source: Optional[str]) -> Optional[str]:
    if not source:
        return None
    cleaned = source.strip().lower()
    return cleaned if cleaned in VALID_ALBUM_SOURCES else None


def normalize_member_source(source: Optional[str]) -> str:
    if not source:
        return 'discogs'
    cleaned = source.strip().lower()
    return cleaned if cleaned in VALID_MEMBER_SOURCES else 'discogs'


def _safe_int(value, default: Optional[int] = None) -> Optional[int]:
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def _clean_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = str(value).strip()
    if re.match(r'^\d{4}(-\d{2})?(-\d{2})?$', value):
        year = int(value[:4])
        if 1900 <= year <= 2100:
            return value
    return None


# ═══════════════════════════════════════════════════════════
# NORMALISATION DES NOMS
# ═══════════════════════════════════════════════════════════

NAME_NORMALIZATION = {
    'ACDC': 'AC/DC', 'AC DC': 'AC/DC',
    'Motorhead': 'Motörhead',
    'Motley Crue': 'Mötley Crüe',
    'Queensryche': 'Queensrÿche',
}


def normalize_name(name: str) -> str:
    if not name:
        return ''
    normalized = ' '.join(name.strip().split()).lower()
    normalized = normalized.replace('ö', 'o').replace('ü', 'u')
    normalized = normalized.replace('ä', 'a').replace('é', 'e')
    normalized = normalized.replace('è', 'e').replace('ê', 'e')
    normalized = normalized.replace('ñ', 'n')
    normalized = normalized.replace('/', '').replace('-', '')
    return normalized


def get_canonical_name(name: str) -> str:
    if not name:
        return ''
    cleaned = name.strip()
    if cleaned in NAME_NORMALIZATION:
        return NAME_NORMALIZATION[cleaned]
    normalized = normalize_name(cleaned)
    for canonical in NAME_NORMALIZATION:
        if normalize_name(canonical) == normalized:
            return NAME_NORMALIZATION[canonical]
    return cleaned


# ═══════════════════════════════════════════════════════════
# DÉDUPLICATION & RÉSOLUTION D'HOMONYMES
# ═══════════════════════════════════════════════════════════

def deduplicate_bands(bands: List[Dict]) -> Tuple[List[Dict], int]:
    seen: Dict[str, Dict] = {}
    duplicates = 0
    for band in bands:
        name = band.get('name', '').strip()
        if not name:
            continue
        normalized = normalize_name(name)
        listeners = _safe_int(band.get('listeners', 0), 0)
        if normalized in seen:
            existing_listeners = _safe_int(seen[normalized].get('listeners', 0), 0)
            if listeners > existing_listeners:
                seen[normalized] = band
                duplicates += 1
        else:
            band_copy = band.copy()
            band_copy['name'] = get_canonical_name(name)
            seen[normalized] = band_copy
    return list(seen.values()), duplicates


def resolve_homonyms(bands: List[Dict]) -> Tuple[List[Dict], int]:
    by_name: Dict[str, List[Dict]] = {}
    for band in bands:
        name = band.get('name', '').strip()
        if not name:
            continue
        normalized = normalize_name(name)
        by_name.setdefault(normalized, []).append(band)

    homonyms = {k: v for k, v in by_name.items() if len(v) > 1}
    if not homonyms:
        return bands, 0

    print(f"\n⚠️  {len(homonyms)} cas d'homonymes détectés")
    resolved_bands = []
    resolved_count = 0

    for band in bands:
        name = band.get('name', '').strip()
        normalized = normalize_name(name)
        if normalized in homonyms and len(homonyms[normalized]) > 1:
            country = band.get('country', 'Unknown')
            new_name = f"{name} ({country})"
            new_band = band.copy()
            new_band['name'] = new_name
            new_band['original_name'] = name
            resolved_bands.append(new_band)
            resolved_count += 1
            print(f"   🎭 '{name}' → '{new_name}'")
        else:
            resolved_bands.append(band)

    return resolved_bands, resolved_count


# ═══════════════════════════════════════════════════════════
# HASH STABLE & PRÉPARATION
# ═══════════════════════════════════════════════════════════

def _stable_hash_id(name: str, salt: str = '') -> int:
    normalized = normalize_name(name)
    hash_input = f"{normalized}:{salt}".encode('utf-8')
    hash_bytes = hashlib.md5(hash_input).digest()
    return int.from_bytes(hash_bytes[:4], 'big') % (2**31 - 1)


def _album_hash_id(band_id: int, title: str) -> int:
    normalized = normalize_name(title)
    hash_input = f"album:{band_id}:{normalized}".encode('utf-8')
    hash_bytes = hashlib.md5(hash_input).digest()
    return int.from_bytes(hash_bytes[:4], 'big') % (2**31 - 1)


def _member_hash_id(band_id: int, name: str) -> int:
    normalized = normalize_name(name)
    hash_input = f"member:{band_id}:{normalized}".encode('utf-8')
    hash_bytes = hashlib.md5(hash_input).digest()
    return int.from_bytes(hash_bytes[:4], 'big') % (2**31 - 1)


def prepare_for_supabase(band: Dict, existing_ids: Optional[Set[int]] = None,
                         existing_band_ids: Optional[Dict[str, int]] = None) -> Dict:
    name = (band.get('name') or '').strip()

    # Utiliser l'ID existant si le band est déjà en base
    if existing_band_ids and name in existing_band_ids:
        band_id = existing_band_ids[name]
    else:
        band_id = _stable_hash_id(name)
        salt_counter = 0
        while existing_ids is not None and band_id in existing_ids:
            salt_counter += 1
            band_id = _stable_hash_id(name, salt=str(salt_counter))

    if existing_ids is not None:
        existing_ids.add(band_id)

    status = normalize_status(band.get('status'))
    bio_lang = normalize_bio_lang(band.get('bio_lang'))
    country_source = normalize_country_source(band.get('country_source'))
    formed_source = normalize_formed_source(band.get('formed_source'))
    image_source = normalize_image_source(band.get('image_source'))
    albums_source = normalize_albums_source(band.get('albums_source'))

    formed = band.get('formed')
    if formed is not None:
        formed = _safe_int(formed)
        if formed is not None and (formed < 1900 or formed > 2100):
            formed = None
            formed_source = 'unknown'

    formed_date = _clean_date(band.get('formed_date'))
    disbanded_date = _clean_date(band.get('disbanded_date'))

    listeners = _safe_int(band.get('listeners', 0), 0)
    if listeners < 0:
        listeners = 0

    mbid = band.get('mbid')
    if mbid:
        mbid = str(mbid).strip()
        if len(mbid) != 36 or mbid.count('-') != 4:
            mbid = None

    rating = band.get('rating')
    if rating is not None:
        try:
            rating = float(rating)
            if not (0 <= rating <= 5):
                rating = None
        except (ValueError, TypeError):
            rating = None

    rating_votes = _safe_int(band.get('rating_votes'))
    if rating_votes is not None and rating_votes < 0:
        rating_votes = None

    prepared = {
        'id': band_id,
        'name': name[:200],
        'genre': normalize_genre(band.get('genre', 'Metal'))[:50],
        'genre_pillar': normalize_genre_pillar(band.get('genre', 'Metal')),  # ✨ AJOUT
        'country': normalize_country(band.get('country'))[:50],
        'formed': formed,
        'formed_date': formed_date,
        'formed_source': formed_source,
        'status': status[:50],
        'disbanded_date': disbanded_date,
        'biography': band.get('biography'),
        'image_url': band.get('image_url'),
        'image_source': image_source,
        'listeners': listeners,
        'source_tag': (band.get('source_tag') or '')[:50] or None,
        'fetched_at': band.get('fetched_at') or datetime.now(timezone.utc).isoformat(),
        'bio_lang': bio_lang,
        'mbid': mbid,
        'country_source': country_source,
        'albums_source': albums_source,
        'rating': rating,
        'rating_votes': rating_votes,
        'discogs_id': _safe_int(band.get('discogs_id')),
        'discogs_uri': band.get('discogs_uri'),
    }

    if band.get('original_name') and band['original_name'] != name:
        prepared['original_name'] = band['original_name'][:200]

    return prepared


def prepare_albums(band_id: int, band_data: Dict) -> List[Dict]:
    albums_raw = band_data.get('albums', [])
    albums_source = band_data.get('albums_source')

    if not albums_raw or not albums_source:
        return []

    prepared = []
    for album in albums_raw:
        title = (album.get('name') or album.get('title') or '').strip()
        if not title:
            continue

        image_url = album.get('image') or album.get('cover_image')
        year = _safe_int(album.get('year'))
        if year is not None and not (1900 <= year <= datetime.now().year + 1):
            year = None

        playcount = _safe_int(album.get('playcount'))
        if playcount is not None and playcount < 0:
            playcount = 0

        source = albums_source if albums_source in VALID_ALBUM_SOURCES else 'lastfm'

        mbid = album.get('mbid')
        if mbid:
            mbid = str(mbid).strip()
            if len(mbid) != 36 or mbid.count('-') != 4:
                mbid = None

        image_source = normalize_image_source(album.get('image_source'))
        if not image_source and image_url:
            image_source = 'lastfm' if source == 'lastfm' else 'discogs'

        prepared.append({
            'id': _album_hash_id(band_id, title),
            'band_id': band_id,
            'source': source,
            'title': title[:300],
            'artist': (album.get('artist') or '')[:200] or None,
            'year': year,
            'image_url': image_url,
            'image_source': image_source,
            'mbid': mbid,
            'url': album.get('url'),
            'playcount': playcount,
            'release_type': (album.get('type') or '')[:50] or None,
            'uri': album.get('uri'),
        })

    return prepared


def prepare_members(band_id: int, band_data: Dict) -> List[Dict]:
    members_raw = band_data.get('members', [])
    if not members_raw:
        return []

    prepared = []
    seen_names: Set[str] = set()

    for member in members_raw:
        name = (member.get('name') or '').strip()
        if not name:
            continue

        name_normalized = normalize_name(name)
        if name_normalized in seen_names:
            continue
        seen_names.add(name_normalized)

        role = member.get('role') or 'musician'
        source = normalize_member_source(member.get('source'))
        begin_date = _clean_date(member.get('begin'))
        end_date = _clean_date(member.get('end'))
        is_active = not member.get('ended', False)

        prepared.append({
            'id': _member_hash_id(band_id, name),
            'band_id': band_id,
            'name': name[:200],
            'role': (role or '')[:100] or None,
            'source': source,
            'begin_date': begin_date,
            'end_date': end_date,
            'is_active': is_active,
        })

    return prepared


# ═══════════════════════════════════════════════════════════
# FILTRAGE
# ═══════════════════════════════════════════════════════════

def filter_by_listeners(bands: List[Dict], min_listeners: int) -> Tuple[List[Dict], int]:
    if min_listeners <= 0:
        return bands, 0
    filtered, removed = [], 0
    for band in bands:
        listeners = _safe_int(band.get('listeners', 0), 0)
        if listeners >= min_listeners:
            filtered.append(band)
        else:
            removed += 1
    return filtered, removed


# ═══════════════════════════════════════════════════════════
# CHECKPOINT
# ═══════════════════════════════════════════════════════════

def load_checkpoint(checkpoint_path: str) -> Dict:
    path = Path(checkpoint_path)
    default = {
        'last_index': 0, 'success_count': 0, 'error_count': 0,
        'updated_count': 0, 'started_at': None, 'last_updated': None,
        'albums_count': 0, 'members_count': 0,
    }
    if not path.exists():
        return default
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for k, v in default.items():
            data.setdefault(k, v)
        return data
    except (json.JSONDecodeError, IOError):
        return default


def save_checkpoint(checkpoint_path: str, checkpoint: Dict):
    path = Path(checkpoint_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    checkpoint['last_updated'] = datetime.now(timezone.utc).isoformat()
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(checkpoint, f, indent=2, ensure_ascii=False)


def reset_checkpoint(checkpoint_path: str):
    path = Path(checkpoint_path)
    if path.exists():
        path.unlink()
        print(f"🗑️  Checkpoint supprimé: {checkpoint_path}")


# ═══════════════════════════════════════════════════════════
# CHARGEMENT DES DONNÉES (supporte les 2 formats)
# ═══════════════════════════════════════════════════════════

def load_bands_from_json(input_path: str) -> List[Dict]:
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and 'bands' in data:
        return data.get('bands', [])
    else:
        raise ValueError("Format JSON inattendu")


# ═══════════════════════════════════════════════════════════
# ✨ DÉDUPLICATION DES ALBUMS ET MEMBERS PAR BATCH
# ═══════════════════════════════════════════════════════════

def deduplicate_albums(albums: List[Dict]) -> List[Dict]:
    """
    Déduplique les albums par ID ET par (band_id, title).
    Double protection : évite les collisions de hash ET les doublons logiques.
    """
    seen_ids = set()
    seen_band_title = set()
    unique = []
    for album in albums:
        if album['id'] in seen_ids:
            continue
        seen_ids.add(album['id'])
        key = (album['band_id'], album['title'].lower())
        if key in seen_band_title:
            continue
        seen_band_title.add(key)
        unique.append(album)
    return unique


def deduplicate_members(members: List[Dict]) -> List[Dict]:
    """
    Déduplique les membres par ID ET par (band_id, name).
    Double protection : évite les collisions de hash ET les doublons logiques.
    """
    seen_ids = set()
    seen_band_name = set()
    unique = []
    for member in members:
        if member['id'] in seen_ids:
            continue
        seen_ids.add(member['id'])
        key = (member['band_id'], member['name'].lower())
        if key in seen_band_name:
            continue
        seen_band_name.add(key)
        unique.append(member)
    return unique


# ═══════════════════════════════════════════════════════════
# ✨ VIDAGE DES TABLES PAR LOTS (évite le timeout)
# ═══════════════════════════════════════════════════════════

def purge_table(supabase: Client, table: str, batch_size: int = PURGE_BATCH_SIZE,
                use_truncate: bool = False) -> int:
    """
    Vide une table par lots de `batch_size` enregistrements.
    Retourne le nombre total d'enregistrements supprimés.
    """
    if use_truncate:
        try:
            supabase.rpc(f'truncate_{table}').execute()
            print(f"✅ Table {table} tronquée (TRUNCATE)")
            return -1
        except Exception:
            print(f"⚠️  TRUNCATE impossible, bascule sur DELETE par lots")

    total_deleted = 0
    iteration = 0
    while True:
        iteration += 1
        try:
            result = supabase.table(table).select('id').limit(batch_size).execute()
            if not result.data:
                break
            ids_to_delete = [row['id'] for row in result.data]
            supabase.table(table).delete().in_('id', ids_to_delete).execute()
            deleted_count = len(ids_to_delete)
            total_deleted += deleted_count
            print(f"   🗑️  Lot {iteration}: {deleted_count:,} {table} supprimés (total: {total_deleted:,})")
            time.sleep(0.5)
        except Exception as e:
            print(f"⚠️  Erreur lors du vidage (lot {iteration}): {e}")
            break
    return total_deleted


# ═══════════════════════════════════════════════════════════
# ✨ RÉCUPÉRATION DES IDs EXISTANTS DES BANDS
# ═══════════════════════════════════════════════════════════

def get_existing_band_ids(supabase: Client) -> Dict[str, int]:
    """
    Récupère tous les bands existants en base avec leur ID.
    Retourne un dict {name: id}.
    """
    band_id_map = {}
    try:
        offset = 0
        while True:
            result = supabase.table('bands').select('id, name').range(offset, offset + 999).execute()
            if not result.data:
                break
            for row in result.data:
                band_id_map[row['name']] = row['id']
            if len(result.data) < 1000:
                break
            offset += 1000
        print(f"📋 {len(band_id_map):,} bands existants récupérés en base")
    except Exception as e:
        print(f"⚠️  Erreur récupération IDs existants: {e}")
    return band_id_map


# ═══════════════════════════════════════════════════════════
# IMPORT VERS SUPABASE
# ═══════════════════════════════════════════════════════════

def _upsert_with_retry(supabase: Client, table: str, batch: List[Dict],
                       conflict_field: str = 'id') -> Tuple[int, int]:
    """
    Upsert avec retry élément par élément en cas de conflit.
    Loggue les erreurs détaillées et retry pour TOUS les types d'erreurs.
    """
    success = 0
    errors = 0
    try:
        supabase.table(table).upsert(batch, on_conflict=conflict_field).execute()
        return len(batch), 0
    except Exception as e:
        print(f"\n⚠️  Erreur {table} (batch de {len(batch)}) : {str(e)[:200]}")
        for item in batch:
            try:
                supabase.table(table).upsert([item], on_conflict=conflict_field).execute()
                success += 1
            except Exception as item_e:
                errors += 1
                if errors <= 10:
                    item_name = item.get('title') or item.get('name') or f"ID:{item.get('id')}"
                    print(f"   ❌ [{table}] {item_name}")
                    print(f"      Erreur : {str(item_e)[:150]}")
    return success, errors


def import_to_supabase(
    bands: List[Dict],
    batch_size: int,
    checkpoint_path: str,
    dry_run: bool = False,
    import_albums: bool = True,
    import_members: bool = True,
    truncate_before_import: bool = False,
    truncate_bands: bool = False,  # ✨ AJOUT
) -> Dict[str, int]:
    supabase: Optional[Client] = None
    existing_band_ids: Dict[str, int] = {}

    if not dry_run:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("❌ Erreur: Variables Supabase manquantes dans .env")
            return {'success': 0, 'errors': 0, 'updated': 0, 'albums': 0, 'members': 0}
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"❌ Erreur de connexion à Supabase: {e}")
            return {'success': 0, 'errors': 0, 'updated': 0, 'albums': 0, 'members': 0}

        # ✨ Vider la table bands si demandé (AVANT de récupérer les IDs existants)
        if truncate_bands:
            print(f"\n🧹 Vidage de la table bands...")
            deleted = purge_table(supabase, 'bands', use_truncate=truncate_before_import)
            if deleted >= 0:
                print(f"✅ Table bands vidée ({deleted:,} enregistrements)")

        # Récupérer les IDs existants des bands en base
        existing_band_ids = get_existing_band_ids(supabase)

        # Vider les tables albums et members avant l'import (par lots)
        if import_albums:
            print(f"\n🧹 Vidage de la table albums...")
            deleted = purge_table(supabase, 'albums', use_truncate=truncate_before_import)
            if deleted >= 0:
                print(f"✅ Table albums vidée ({deleted:,} enregistrements)")

        if import_members:
            print(f"\n🧹 Vidage de la table members...")
            deleted = purge_table(supabase, 'members', use_truncate=truncate_before_import)
            if deleted >= 0:
                print(f"✅ Table members vidée ({deleted:,} enregistrements)")

    checkpoint = load_checkpoint(checkpoint_path)
    start_index = checkpoint['last_index']
    success_count = checkpoint['success_count']
    error_count = checkpoint['error_count']
    albums_count = checkpoint.get('albums_count', 0)
    members_count = checkpoint.get('members_count', 0)

    if start_index > 0:
        print(f"\n🔄 Reprise depuis le checkpoint : index {start_index}")
        print(f"   ✅ Déjà importés : {success_count}")
        if import_albums:
            print(f"   💿 Albums importés : {albums_count:,}")
        if import_members:
            print(f"   👥 Membres importés : {members_count:,}")
    else:
        checkpoint['started_at'] = datetime.now(timezone.utc).isoformat()

    remaining_bands = bands[start_index:]
    total_to_process = len(remaining_bands)

    if total_to_process == 0:
        print("✅ Tous les groupes ont déjà été importés !")
        return {'success': success_count, 'errors': error_count, 'updated': 0,
                'albums': albums_count, 'members': members_count}

    print(f"\n📦 Import de {total_to_process} groupes restants (par lots de {batch_size})")

    if dry_run:
        print("🧪 MODE DRY-RUN : aucun import réel ne sera effectué\n")

    scope_desc = []
    if import_albums:
        scope_desc.append("albums")
    if import_members:
        scope_desc.append("membres")
    if scope_desc:
        print(f"   📚 Également importés : {', '.join(scope_desc)}")

    existing_ids: Set[int] = set()
    batches = [remaining_bands[i:i + batch_size] for i in range(0, total_to_process, batch_size)]

    for batch_idx, batch in enumerate(tqdm(batches, desc="Import")):
        prepared_bands = [prepare_for_supabase(band, existing_ids, existing_band_ids) for band in batch]

        if dry_run:
            success_count += len(prepared_bands)
            for band_data, prepared in zip(batch, prepared_bands):
                if import_albums:
                    albums_count += len(prepare_albums(prepared['id'], band_data))
                if import_members:
                    members_count += len(prepare_members(prepared['id'], band_data))
        else:
            # Upsert des bands avec on_conflict='name'
            s, e = _upsert_with_retry(supabase, 'bands', prepared_bands, conflict_field='name')
            success_count += s
            error_count += e

            # Récupérer les IDs réels des bands en base
            band_names_in_batch = [p['name'] for p in prepared_bands]
            try:
                result = supabase.table('bands').select('id, name').in_('name', band_names_in_batch).execute()
                band_id_map = {row['name']: row['id'] for row in result.data}
            except Exception as e:
                print(f"⚠️  Erreur récupération IDs réels: {e}")
                band_id_map = {}

            # 2. Import des albums
            if import_albums and s > 0:
                all_albums = []
                for band_data, prepared in zip(batch, prepared_bands):
                    real_band_id = band_id_map.get(prepared['name'], prepared['id'])
                    albums = prepare_albums(real_band_id, band_data)
                    all_albums.extend(albums)

                all_albums = deduplicate_albums(all_albums)
                if all_albums:
                    for i in range(0, len(all_albums), 100):
                        sub_batch = all_albums[i:i + 100]
                        s_a, e_a = _upsert_with_retry(supabase, 'albums', sub_batch, conflict_field='id')
                        albums_count += s_a
                        error_count += e_a

            # 3. Import des membres
            if import_members and s > 0:
                all_members = []
                for band_data, prepared in zip(batch, prepared_bands):
                    real_band_id = band_id_map.get(prepared['name'], prepared['id'])
                    members = prepare_members(real_band_id, band_data)
                    all_members.extend(members)

                all_members = deduplicate_members(all_members)
                if all_members:
                    for i in range(0, len(all_members), 100):
                        sub_batch = all_members[i:i + 100]
                        s_m, e_m = _upsert_with_retry(supabase, 'members', sub_batch, conflict_field='id')
                        members_count += s_m
                        error_count += e_m

        if not dry_run:
            checkpoint['last_index'] = start_index + (batch_idx + 1) * batch_size
            checkpoint['success_count'] = success_count
            checkpoint['error_count'] = error_count
            checkpoint['albums_count'] = albums_count
            checkpoint['members_count'] = members_count
            save_checkpoint(checkpoint_path, checkpoint)

        if not dry_run and batch_idx < len(batches) - 1:
            time.sleep(0.1)

    return {'success': success_count, 'errors': error_count, 'updated': 0,
            'albums': albums_count, 'members': members_count}


# ═══════════════════════════════════════════════════════════
# STATISTIQUES
# ═══════════════════════════════════════════════════════════

def print_statistics(bands: List[Dict], filtered_bands: List[Dict],
                     removed_by_listeners: int, min_listeners: int):
    print("\n" + "=" * 60)
    print("📊 STATISTIQUES DES DONNÉES")
    print("=" * 60)

    print(f"\n🔢 Groupes chargés        : {len(bands):,}")
    print(f"🔍 Groupes après filtre   : {len(filtered_bands):,}")
    print(f"🗑️  Groupes filtrés        : {removed_by_listeners:,}")
    if min_listeners > 0:
        print(f"   (Seuil: {min_listeners:,} listeners minimum)")

    countries: Dict[str, int] = {}
    for band in filtered_bands:
        country = normalize_country(band.get('country'))
        countries[country] = countries.get(country, 0) + 1

    print(f"\n🌍 Top 10 des pays :")
    for country, count in sorted(countries.items(), key=lambda x: x[1], reverse=True)[:10]:
        bar = "█" * (count * 40 // max(len(filtered_bands), 1))
        print(f"   {country:25s} {bar} {count:,}")

    genres: Dict[str, int] = {}
    for band in filtered_bands:
        genre = normalize_genre(band.get('genre', 'Metal'))
        genres[genre] = genres.get(genre, 0) + 1

    print(f"\n🎸 Top 10 des genres :")
    for genre, count in sorted(genres.items(), key=lambda x: x[1], reverse=True)[:10]:
        bar = "█" * (count * 40 // max(len(filtered_bands), 1))
        print(f"   {genre:25s} {bar} {count:,}")

    # ✨ Statistiques par pilier
    pillars: Dict[str, int] = {}
    for band in filtered_bands:
        pillar = normalize_genre_pillar(band.get('genre', 'Metal'))
        pillars[pillar] = pillars.get(pillar, 0) + 1

    print(f"\n🏛️  Répartition par pilier (genre_pillar) :")
    for pillar, count in sorted(pillars.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * (count * 40 // max(len(filtered_bands), 1))
        print(f"   {pillar:25s} {bar} {count:,}")

    total_albums = 0
    albums_with_covers = 0
    bands_with_albums = 0
    for band in filtered_bands:
        albums = band.get('albums', [])
        if albums:
            bands_with_albums += 1
            total_albums += len(albums)
            for a in albums:
                if a.get('image') or a.get('cover_image'):
                    albums_with_covers += 1

    print(f"\n💿 Statistiques albums :")
    print(f"   Total albums       : {total_albums:,}")
    print(f"   Albums avec cover  : {albums_with_covers:,} ({100 * albums_with_covers // max(total_albums, 1)}%)")
    print(f"   Groupes avec albums: {bands_with_albums:,}")

    total_members = 0
    members_by_source: Dict[str, int] = {'musicbrainz': 0, 'discogs': 0}
    active_members = 0
    for band in filtered_bands:
        for m in band.get('members', []):
            total_members += 1
            src = normalize_member_source(m.get('source'))
            members_by_source[src] = members_by_source.get(src, 0) + 1
            if not m.get('ended', False):
                active_members += 1

    print(f"\n👥 Statistiques membres :")
    print(f"   Total membres          : {total_members:,}")
    print(f"   Membres actifs         : {active_members:,}")
    print(f"   Source MusicBrainz     : {members_by_source.get('musicbrainz', 0):,}")
    print(f"   Source Discogs         : {members_by_source.get('discogs', 0):,}")

    image_sources: Dict[str, int] = {}
    for band in filtered_bands:
        src = band.get('image_source') or 'none'
        image_sources[src] = image_sources.get(src, 0) + 1

    print(f"\n🖼️  Sources des images artiste :")
    for src, count in sorted(image_sources.items(), key=lambda x: x[1], reverse=True):
        print(f"   {src:35s} : {count:,}")

    with_bio = sum(1 for b in filtered_bands if b.get('biography'))
    with_image = sum(1 for b in filtered_bands if b.get('image_url'))
    with_mbid = sum(1 for b in filtered_bands if b.get('mbid'))
    with_formed_date = sum(1 for b in filtered_bands if _clean_date(b.get('formed_date')))

    print(f"\n📈 Qualité des données :")
    total = max(len(filtered_bands), 1)
    print(f"   Avec biographie    : {with_bio:,} ({100 * with_bio // total}%)")
    print(f"   Avec image         : {with_image:,} ({100 * with_image // total}%)")
    print(f"   Avec MBID          : {with_mbid:,} ({100 * with_mbid // total}%)")
    print(f"   Avec date complète : {with_formed_date:,} ({100 * with_formed_date // total}%)")

    print("=" * 60 + "\n")


# ═══════════════════════════════════════════════════════════
# CLI PRINCIPAL
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Import des groupes metal avec albums et membres',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument('--input', type=str, default=DEFAULT_INPUT)
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument('--min-listeners', type=int, default=DEFAULT_MIN_LISTENERS)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--reset-checkpoint', action='store_true')
    parser.add_argument('--stats-only', action='store_true')
    parser.add_argument('--checkpoint-file', type=str, default=CHECKPOINT_FILE)
    parser.add_argument('--skip-homonym-resolution', action='store_true')
    parser.add_argument('--skip-albums', action='store_true')
    parser.add_argument('--skip-members', action='store_true')
    parser.add_argument('--truncate-before-import', action='store_true',
                        help='Utilise TRUNCATE au lieu de DELETE (plus rapide)')
    parser.add_argument('--truncate-bands', action='store_true',
                        help='Tronque aussi la table bands avant l\'import (attention : supprime tous les bands)')
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("🎸 METALPEDIA - Import Supabase")
    print("=" * 60)

    if not Path(args.input).exists():
        print(f"\n❌ Fichier introuvable: {args.input}")
        print("💡 Exécutez d'abord: python fetch_metal_bands.py")
        return

    if args.reset_checkpoint:
        reset_checkpoint(args.checkpoint_file)

    print(f"\n📂 Chargement depuis: {args.input}")
    try:
        bands = load_bands_from_json(args.input)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"❌ Erreur de chargement: {e}")
        return
    print(f"   {len(bands):,} groupes trouvés")

    print(f"\n🔍 Déduplication...")
    bands, duplicates_in_source = deduplicate_bands(bands)
    print(f"   ✅ {len(bands):,} groupes uniques")
    print(f"   🗑️  {duplicates_in_source:,} doublons supprimés")

    if not args.skip_homonym_resolution:
        print(f"\n🎭 Résolution des homonymes...")
        bands, homonyms_resolved = resolve_homonyms(bands)
        if homonyms_resolved > 0:
            print(f"   ✅ {homonyms_resolved} homonymes résolus")

    if args.min_listeners > 0:
        print(f"\n🔍 Filtrage: minimum {args.min_listeners:,} listeners")
        bands, removed = filter_by_listeners(bands, args.min_listeners)
        print(f"   ✅ {len(bands):,} groupes conservés")
        print(f"   ❌ {removed:,} groupes écartés")
    else:
        removed = 0

    print_statistics([], bands, removed, args.min_listeners)

    if args.stats_only:
        print("📊 Mode stats uniquement - aucun import effectué")
        return

    if args.dry_run:
        print("🧪 MODE DRY-RUN ACTIVÉ\n")

    import_albums = not args.skip_albums
    import_members = not args.skip_members

    start_time = time.time()
    stats = import_to_supabase(
        bands, args.batch_size, args.checkpoint_file, args.dry_run,
        import_albums=import_albums, import_members=import_members,
        truncate_before_import=args.truncate_before_import,
        truncate_bands=args.truncate_bands,  # ✨ AJOUT
    )
    elapsed = time.time() - start_time

    print("\n" + "=" * 60)
    print("✅ IMPORT TERMINÉ")
    print("=" * 60)
    print(f"   ✅ Groupes insérés/Mis à jour : {stats['success']:,}")
    print(f"   ❌ Échoués                    : {stats['errors']:,}")
    if import_albums:
        print(f"   💿 Albums importés            : {stats['albums']:,}")
    if import_members:
        print(f"   👥 Membres importés           : {stats['members']:,}")
    print(f"   ⏱️  Durée                      : {elapsed:.1f}s")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()
