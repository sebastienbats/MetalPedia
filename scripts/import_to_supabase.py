#!/usr/bin/env python3
"""
Importe les groupes metal vers Supabase avec :
- Gestion robuste des doublons (hash stable + contrainte UNIQUE)
- Normalisation des genres, pays, langues et sources
- Checkpoint pour reprise sur interruption
- Filtrage par popularité (listeners)
- Résolution des homonymes
- Support des champs MusicBrainz (mbid, country_source, formed_source)

Usage:
  python import_to_supabase.py                                  # Import standard
  python import_to_supabase.py --min-listeners 1000            # Qualité élevée
  python import_to_supabase.py --dry-run                       # Test sans import
  python import_to_supabase.py --reset-checkpoint              # Reprendre depuis 0
  python import_to_supabase.py --stats-only                    # Juste les stats
"""

import os
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

# ═══════════════════════════════════════════════════════════
# CONSTANTES DE VALIDATION (doivent correspondre aux CHECK SQL)
# ═══════════════════════════════════════════════════════════

VALID_STATUSES = {'Active', 'On hold', 'Split-up', 'Unknown', 'Changed name', 'Disputed', 'Vacation'}
VALID_BIO_LANGS = {'fr', 'en', 'de', 'es', 'it', 'pl', 'pt', 'ru', 'sv', 'ja', 'zh', 'none'}
VALID_COUNTRY_SOURCES = {'musicbrainz', 'lastfm_tags', 'unknown'}
VALID_FORMED_SOURCES = {'musicbrainz', 'unknown'}

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

def normalize_genre(genre: str) -> str:
    if not genre:
        return 'Metal'
    if genre in GENRE_NORMALIZATION:
        return GENRE_NORMALIZATION[genre]
    if genre in VALID_TYPESCRIPT_GENRES:
        return genre
    return 'Metal'

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
# NORMALISATION DES SOURCES
# ═══════════════════════════════════════════════════════════

def normalize_country_source(source: Optional[str]) -> str:
    """Normalise la source du pays pour correspondre à la contrainte SQL."""
    if not source:
        return 'unknown'
    cleaned = source.strip().lower()
    if cleaned in VALID_COUNTRY_SOURCES:
        return cleaned
    return 'unknown'

def normalize_formed_source(source: Optional[str]) -> str:
    """Normalise la source de l'année de formation."""
    if not source:
        return 'unknown'
    cleaned = source.strip().lower()
    if cleaned in VALID_FORMED_SOURCES:
        return cleaned
    return 'unknown'

def normalize_bio_lang(bio_lang: Optional[str]) -> Optional[str]:
    if not bio_lang:
        return None
    cleaned = bio_lang.strip().lower()
    if cleaned in VALID_BIO_LANGS:
        return cleaned
    return None

def normalize_status(status: Optional[str]) -> str:
    if not status:
        return 'Unknown'
    cleaned = status.strip()
    if cleaned.title() in VALID_STATUSES:
        return cleaned.title()
    if cleaned in VALID_STATUSES:
        return cleaned
    return 'Unknown'

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
        try:
            listeners = int(band.get('listeners', 0) or 0)
        except (ValueError, TypeError):
            listeners = 0
        
        if normalized in seen:
            try:
                existing_listeners = int(seen[normalized].get('listeners', 0) or 0)
            except (ValueError, TypeError):
                existing_listeners = 0
            
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

def prepare_for_supabase(
    band: Dict, 
    existing_ids: Optional[Set[int]] = None
) -> Dict:
    """
    Prépare un groupe pour l'insertion Supabase.
    Tous les champs sont normalisés pour respecter les contraintes SQL.
    """
    name = (band.get('name') or '').strip()
    
    # Gestion des collisions de hash
    band_id = _stable_hash_id(name)
    salt_counter = 0
    while existing_ids is not None and band_id in existing_ids:
        salt_counter += 1
        band_id = _stable_hash_id(name, salt=str(salt_counter))
    
    if existing_ids is not None:
        existing_ids.add(band_id)
    
    # Normalisation de tous les champs
    status = normalize_status(band.get('status'))
    bio_lang = normalize_bio_lang(band.get('bio_lang'))
    country_source = normalize_country_source(band.get('country_source'))
    formed_source = normalize_formed_source(band.get('formed_source'))
    
    # Gestion de l'année de formation
    formed = band.get('formed')
    if formed is not None:
        try:
            formed = int(formed)
            if formed < 1900 or formed > 2100:
                formed = None
                formed_source = 'unknown'
        except (ValueError, TypeError):
            formed = None
            formed_source = 'unknown'
    
    # Gestion des listeners
    try:
        listeners = int(band.get('listeners', 0) or 0)
        if listeners < 0:
            listeners = 0
    except (ValueError, TypeError):
        listeners = 0
    
    # Gestion du MBID (format UUID)
    mbid = band.get('mbid')
    if mbid:
        mbid = str(mbid).strip()
        # Validation basique du format UUID
        if len(mbid) != 36 or mbid.count('-') != 4:
            mbid = None
    
    prepared = {
        'id': band_id,
        'name': name[:200],
        'genre': normalize_genre(band.get('genre', 'Metal'))[:50],
        'country': normalize_country(band.get('country'))[:50],
        'formed': formed,
        'status': status[:50],
        'biography': band.get('biography'),
        'image_url': band.get('image_url'),
        'listeners': listeners,
        'source_tag': (band.get('source_tag') or '')[:50] or None,
        'fetched_at': band.get('fetched_at') or datetime.now(timezone.utc).isoformat(),
        'bio_lang': bio_lang,
        # 🆕 Nouveaux champs MusicBrainz
        'mbid': mbid,
        'country_source': country_source,
        'formed_source': formed_source,
    }
    
    # original_name : seulement si différent du nom actuel
    if band.get('original_name') and band['original_name'] != name:
        prepared['original_name'] = band['original_name'][:200]
    
    return prepared

# ═══════════════════════════════════════════════════════════
# FILTRAGE
# ═══════════════════════════════════════════════════════════

def filter_by_listeners(bands: List[Dict], min_listeners: int) -> Tuple[List[Dict], int]:
    if min_listeners <= 0:
        return bands, 0
    
    filtered, removed = [], 0
    for band in bands:
        try:
            listeners = int(band.get('listeners', 0) or 0)
        except (ValueError, TypeError):
            listeners = 0
        
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
    if not path.exists():
        return {
            'last_index': 0, 'success_count': 0, 'error_count': 0,
            'updated_count': 0, 'started_at': None, 'last_updated': None,
        }
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {
            'last_index': 0, 'success_count': 0, 'error_count': 0,
            'updated_count': 0, 'started_at': None, 'last_updated': None,
        }

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
# IMPORT VERS SUPABASE
# ═══════════════════════════════════════════════════════════

def import_to_supabase(
    bands: List[Dict],
    batch_size: int,
    checkpoint_path: str,
    dry_run: bool = False,
) -> Tuple[int, int, int]:
    supabase: Optional[Client] = None
    
    if not dry_run:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("❌ Erreur: Variables Supabase manquantes dans .env")
            return 0, 0, 0
        
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"❌ Erreur de connexion à Supabase: {e}")
            return 0, 0, 0
    
    checkpoint = load_checkpoint(checkpoint_path)
    start_index = checkpoint['last_index']
    success_count = checkpoint['success_count']
    error_count = checkpoint['error_count']
    updated_count = checkpoint.get('updated_count', 0)
    
    if start_index > 0:
        print(f"\n🔄 Reprise depuis le checkpoint : index {start_index}")
        print(f"   ✅ Déjà importés : {success_count}")
        print(f"   🔄 Déjà mis à jour : {updated_count}")
        print(f"   ❌ Déjà en erreur : {error_count}")
    else:
        checkpoint['started_at'] = datetime.now(timezone.utc).isoformat()
    
    remaining_bands = bands[start_index:]
    total_to_process = len(remaining_bands)
    
    if total_to_process == 0:
        print("✅ Tous les groupes ont déjà été importés !")
        return success_count, error_count, updated_count
    
    print(f"\n📦 Import de {total_to_process} groupes restants (par lots de {batch_size})")
    if dry_run:
        print("🧪 MODE DRY-RUN : aucun import réel ne sera effectué\n")
    
    existing_ids: Set[int] = set()
    
    batches = [
        remaining_bands[i:i + batch_size] 
        for i in range(0, total_to_process, batch_size)
    ]
    
    for batch_idx, batch in enumerate(tqdm(batches, desc="Import")):
        prepared_batch = [prepare_for_supabase(band, existing_ids) for band in batch]
        
        if dry_run:
            success_count += len(prepared_batch)
        else:
            try:
                supabase.table('bands').upsert(
                    prepared_batch, on_conflict='id'
                ).execute()
                success_count += len(prepared_batch)
            except Exception as e:
                error_msg = str(e)
                
                if 'bands_name_unique' in error_msg or 'duplicate key' in error_msg.lower():
                    print(f"\n⚠️  Conflit de nom dans le lot {batch_idx + 1}")
                    
                    for item in prepared_batch:
                        try:
                            supabase.table('bands').upsert(
                                [item], on_conflict='id'
                            ).execute()
                            success_count += 1
                        except Exception as inner_e:
                            if 'bands_name_unique' in str(inner_e):
                                try:
                                    update_data = {k: v for k, v in item.items() if k != 'id'}
                                    supabase.table('bands').update(
                                        update_data
                                    ).eq('name', item['name']).execute()
                                    updated_count += 1
                                except Exception as update_e:
                                    print(f"   ❌ Échec MAJ '{item['name']}': {update_e}")
                                    error_count += 1
                            else:
                                error_count += 1
                else:
                    print(f"\n❌ Erreur lot {batch_idx + 1}: {e}")
                    error_count += len(prepared_batch)
        
        checkpoint['last_index'] = start_index + (batch_idx + 1) * batch_size
        checkpoint['success_count'] = success_count
        checkpoint['error_count'] = error_count
        checkpoint['updated_count'] = updated_count
        save_checkpoint(checkpoint_path, checkpoint)
        
        if not dry_run and batch_idx < len(batches) - 1:
            time.sleep(0.1)
    
    return success_count, error_count, updated_count

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
    
    # Top 10 pays
    countries: Dict[str, int] = {}
    for band in filtered_bands:
        country = normalize_country(band.get('country'))
        countries[country] = countries.get(country, 0) + 1
    
    print(f"\n🌍 Top 10 des pays :")
    sorted_countries = sorted(countries.items(), key=lambda x: x[1], reverse=True)
    for country, count in sorted_countries[:10]:
        bar = "█" * (count * 40 // max(len(filtered_bands), 1))
        print(f"   {country:25s} {bar} {count:,}")
    
    # Top 10 genres
    genres: Dict[str, int] = {}
    for band in filtered_bands:
        genre = normalize_genre(band.get('genre', 'Metal'))
        genres[genre] = genres.get(genre, 0) + 1
    
    print(f"\n🎸 Top 10 des genres :")
    sorted_genres = sorted(genres.items(), key=lambda x: x[1], reverse=True)
    for genre, count in sorted_genres[:10]:
        bar = "█" * (count * 40 // max(len(filtered_bands), 1))
        print(f"   {genre:25s} {bar} {count:,}")
    
    # Distribution des langues de bio
    bio_langs: Dict[str, int] = {}
    for band in filtered_bands:
        lang = normalize_bio_lang(band.get('bio_lang')) or 'none'
        bio_langs[lang] = bio_langs.get(lang, 0) + 1
    
    print(f"\n🌍 Distribution des langues de bio :")
    sorted_langs = sorted(bio_langs.items(), key=lambda x: x[1], reverse=True)
    for lang, count in sorted_langs:
        flag = {'fr': '🇫🇷', 'en': '🇬🇧', 'de': '🇩🇪', 'es': '🇪🇸', 'none': '❌'}.get(lang, '🌐')
        print(f"   {flag} {lang:10s} : {count:,}")
    
    # 🆕 Distribution des sources de pays
    country_sources: Dict[str, int] = {}
    for band in filtered_bands:
        source = normalize_country_source(band.get('country_source'))
        country_sources[source] = country_sources.get(source, 0) + 1
    
    print(f"\n🎵 Sources du pays :")
    for source, count in sorted(country_sources.items(), key=lambda x: x[1], reverse=True):
        icon = {'musicbrainz': '✅', 'lastfm_tags': '🏷️', 'unknown': '❓'}.get(source, '?')
        print(f"   {icon} {source:15s} : {count:,}")
    
    # 🆕 Distribution des sources de l'année de formation
    formed_sources: Dict[str, int] = {}
    for band in filtered_bands:
        source = normalize_formed_source(band.get('formed_source'))
        formed_sources[source] = formed_sources.get(source, 0) + 1
    
    print(f"\n🎵 Sources de l'année de formation :")
    for source, count in sorted(formed_sources.items(), key=lambda x: x[1], reverse=True):
        icon = {'musicbrainz': '✅', 'unknown': '❓'}.get(source, '?')
        print(f"   {icon} {source:15s} : {count:,}")
    
    # Qualité
    with_bio = sum(1 for b in filtered_bands if b.get('biography'))
    with_image = sum(1 for b in filtered_bands if b.get('image_url'))
    with_mbid = sum(1 for b in filtered_bands if b.get('mbid'))
    
    print(f"\n📈 Qualité des données :")
    total = max(len(filtered_bands), 1)
    print(f"   Avec biographie   : {with_bio:,} ({100 * with_bio // total}%)")
    print(f"   Avec image        : {with_image:,} ({100 * with_image // total}%)")
    print(f"   Avec MBID         : {with_mbid:,} ({100 * with_mbid // total}%)")
    
    print("=" * 60 + "\n")

# ═══════════════════════════════════════════════════════════
# CLI PRINCIPAL
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Import des groupes metal avec gestion des doublons',
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
    
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("🎸 METALPEDIA - Import avec gestion des doublons")
    print("=" * 60)
    
    if not Path(args.input).exists():
        print(f"\n❌ Fichier introuvable: {args.input}")
        print("💡 Exécutez d'abord: python fetch_metal_bands.py")
        return
    
    if args.reset_checkpoint:
        reset_checkpoint(args.checkpoint_file)
    
    # 1. Chargement
    print(f"\n📂 Chargement depuis: {args.input}")
    with open(args.input, 'r', encoding='utf-8') as f:
        data = json.load(f)
    bands = data.get('bands', [])
    print(f"   {len(bands):,} groupes trouvés")
    
    # 2. Déduplication
    print(f"\n🔍 Déduplication du JSON source...")
    bands, duplicates_in_source = deduplicate_bands(bands)
    print(f"   ✅ {len(bands):,} groupes uniques")
    print(f"   🗑️  {duplicates_in_source:,} doublons supprimés")
    
    # 3. Résolution des homonymes
    if not args.skip_homonym_resolution:
        print(f"\n🎭 Résolution des homonymes...")
        bands, homonyms_resolved = resolve_homonyms(bands)
        if homonyms_resolved > 0:
            print(f"   ✅ {homonyms_resolved} homonymes résolus")
        else:
            print(f"   ✅ Aucun homonyme détecté")
    
    # 4. Filtrage par listeners
    if args.min_listeners > 0:
        print(f"\n🔍 Filtrage: minimum {args.min_listeners:,} listeners")
        bands, removed = filter_by_listeners(bands, args.min_listeners)
        print(f"   ✅ {len(bands):,} groupes conservés")
        print(f"   ❌ {removed:,} groupes écartés")
    else:
        removed = 0
    
    # 5. Statistiques
    print_statistics([], bands, removed, args.min_listeners)
    
    if args.stats_only:
        print("📊 Mode stats uniquement - aucun import effectué")
        return
    
    if args.dry_run:
        print("🧪 MODE DRY-RUN ACTIVÉ\n")
    
    # 6. Import
    start_time = time.time()
    success, errors, updated = import_to_supabase(
        bands, args.batch_size, args.checkpoint_file, args.dry_run,
    )
    
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 60)
    print("✅ IMPORT TERMINÉ")
    print("=" * 60)
    print(f"   ✅ Insérés/Mis à jour : {success:,}")
    print(f"   🔄 Mises à jour       : {updated:,}")
    print(f"   ❌ Échoués            : {errors:,}")
    print(f"   ⏱️  Durée              : {elapsed:.1f}s")
    if args.dry_run:
        print(f"   🧪 Mode              : DRY-RUN")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    main()
