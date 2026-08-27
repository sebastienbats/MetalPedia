#!/usr/bin/env python3
import os, json, time, hashlib, argparse
from pathlib import Path
from typing import List, Dict, Optional, Set
from datetime import datetime
from tqdm import tqdm
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
DEFAULT_INPUT = '../data/metal_bands.json'
CHECKPOINT_FILE = '../data/import_checkpoint.json'

# Normalisation des genres pour correspondre EXACTEMENT à src/types/api.ts
GENRE_MAP = {
    'Melodic Death Metal': 'Death Metal', 'Brutal Death Metal': 'Death Metal',
    'Technical Death Metal': 'Death Metal', 'Swedish Death Metal': 'Death Metal',
    'Norwegian Black Metal': 'Black Metal', 'Symphonic Black Metal': 'Black Metal',
    'Viking Metal': 'Folk Metal', 'Pagan Metal': 'Folk Metal',
    'Metallic Hardcore': 'Metalcore', 'Math Metal': 'Progressive Metal',
    'Speed Metal': 'Thrash Metal', 'Crossover Thrash': 'Thrash Metal',
    'Post-Metal': 'Progressive Metal', 'Djent': 'Progressive Metal', 'Thrash': 'Thrash Metal'
}
VALID_GENRES = {'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal', 'Power Metal', 
                'Doom Metal', 'Progressive Metal', 'Folk Metal', 'Symphonic Metal', 'Gothic Metal', 
                'Nu Metal', 'Metalcore', 'Sludge Metal', 'Stoner Metal', 'Groove Metal'}

COUNTRY_MAP = {
    'USA': 'United States', 'US': 'United States', 'U.S.': 'United States', 'America': 'United States',
    'UK': 'United Kingdom', 'U.K.': 'United Kingdom', 'England': 'United Kingdom', 'Scotland': 'United Kingdom',
    'Deutschland': 'Germany', 'Sverige': 'Sweden', 'Norge': 'Norway', 'Suomi': 'Finland', 'Danmark': 'Denmark',
    'The Netherlands': 'Netherlands', 'Holland': 'Netherlands', 'Czech Republic': 'Czechia', 'USSR': 'Russia'
}

def normalize_name(name: str) -> str:
    if not name: return ''
    n = ' '.join(name.strip().split()).lower()
    for a, b in [('ö','o'), ('ü','u'), ('ä','a'), ('é','e'), ('è','e'), ('ñ','n')]: n = n.replace(a, b)
    return n.replace('/', '').replace('-', '')

def get_canonical_name(name: str) -> str:
    clean = name.strip()
    mapping = {'ACDC': 'AC/DC', 'Motorhead': 'Motörhead', 'Motley Crue': 'Mötley Crüe', 'Queensryche': 'Queensrÿche'}
    if clean in mapping: return mapping[clean]
    norm = normalize_name(clean)
    for k, v in mapping.items():
        if normalize_name(k) == norm: return v
    return clean

def normalize_genre(genre: str) -> str:
    if not genre: return 'Metal'
    if genre in GENRE_MAP: return GENRE_MAP[genre]
    return genre if genre in VALID_GENRES else 'Metal'

def normalize_country(country: str) -> str:
    if not country: return 'Unknown'
    clean = country.strip()
    if clean in COUNTRY_MAP: return COUNTRY_MAP[clean]
    for k, v in COUNTRY_MAP.items():
        if k.lower() == clean.lower(): return v
    return clean.title()

def deduplicate(bands: List[Dict]) -> List[Dict]:
    seen: Dict[str, Dict] = {}
    for band in bands:
        name = band.get('name', '').strip()
        if not name: continue
        norm = normalize_name(name)
        listeners = int(band.get('listeners', 0) or 0)
        if norm in seen:
            if listeners > int(seen[norm].get('listeners', 0) or 0):
                seen[norm] = band
        else:
            b = band.copy()
            b['name'] = get_canonical_name(name)
            seen[norm] = b
    return list(seen.values())

def stable_hash_id(name: str) -> int:
    h = hashlib.md5(normalize_name(name).encode('utf-8')).digest()
    return int.from_bytes(h[:4], 'big') % (2**31 - 1)

def prepare_for_supabase(band: Dict, existing_ids: Set[int]) -> Dict:
    name = band.get('name', '').strip()
    band_id = stable_hash_id(name)
    salt = 0
    while band_id in existing_ids:
        salt += 1
        band_id = int.from_bytes(hashlib.md5(f"{normalize_name(name)}:{salt}".encode()).digest()[:4], 'big') % (2**31 - 1)
    existing_ids.add(band_id)

    return {
        'id': band_id,
        'name': name[:200],
        'genre': normalize_genre(band.get('genre', 'Metal'))[:50],
        'country': normalize_country(band.get('country'))[:50],
        'formed': band.get('formed'),
        'status': (band.get('status') or 'Active')[:50],
        'biography': band.get('biography'),
        'image_url': band.get('image_url'),
        'listeners': int(band.get('listeners', 0) or 0),
        'source_tag': band.get('source_tag'),
        'fetched_at': band.get('fetched_at') or datetime.utcnow().isoformat()
    }

def load_checkpoint(path: str) -> Dict:
    if not Path(path).exists(): return {'last_index': 0, 'success': 0, 'errors': 0}
    try:
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)
    except: return {'last_index': 0, 'success': 0, 'errors': 0}

def save_checkpoint(path: str, cp: Dict):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: json.dump(cp, f, indent=2)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=str, default=DEFAULT_INPUT)
    parser.add_argument('--batch-size', type=int, default=50)
    parser.add_argument('--min-listeners', type=int, default=0)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--reset-checkpoint', action='store_true')
    args = parser.parse_args()

    if args.reset_checkpoint and Path(CHECKPOINT_FILE).exists():
        Path(CHECKPOINT_FILE).unlink()
        print("🗑️ Checkpoint d'import supprimé")

    if not Path(args.input).exists():
        print(f"❌ Fichier introuvable: {args.input}\n💡 Lance d'abord: python fetch_metal_bands.py")
        return

    with open(args.input, 'r', encoding='utf-8') as f:
        bands = json.load(f).get('bands', [])
    
    print(f"\n📂 {len(bands):,} groupes chargés")
    
    bands = deduplicate(bands)
    print(f"✅ {len(bands):,} groupes uniques après dédoublonnage")

    if args.min_listeners > 0:
        filtered = [b for b in bands if int(b.get('listeners', 0) or 0) >= args.min_listeners]
        print(f"🔍 {len(filtered):,} groupes conservés (>= {args.min_listeners} listeners)")
        bands = filtered

    if args.dry_run:
        print("🧪 MODE DRY-RUN : Aucun écriture dans Supabase\n")
        return

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Variables Supabase manquantes dans .env")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    cp = load_checkpoint(CHECKPOINT_FILE)
    existing_ids: Set[int] = set()
    
    # Récupérer les IDs existants pour éviter les collisions de hash
    try:
        res = supabase.table('bands').select('id').execute()
        existing_ids = {row['id'] for row in res.data}
    except: pass

    remaining = bands[cp['last_index']:]
    print(f"\n📦 Import de {len(remaining):,} groupes restants...")

    for i in tqdm(range(0, len(remaining), args.batch_size), desc="Import"):
        batch = remaining[i:i + args.batch_size]
        prepared = [prepare_for_supabase(b, existing_ids) for b in batch]
        
        try:
            supabase.table('bands').upsert(prepared, on_conflict='id').execute()
            cp['success'] += len(prepared)
        except Exception as e:
            print(f"\n❌ Erreur lot: {e}")
            cp['errors'] += len(prepared)
        
        cp['last_index'] = cp['last_index'] + len(batch)
        save_checkpoint(CHECKPOINT_FILE, cp)
        time.sleep(0.1)

    print(f"\n✅ Terminé ! Réussis: {cp['success']:,} | Échoués: {cp['errors']:,}")

if __name__ == '__main__':
    main()
