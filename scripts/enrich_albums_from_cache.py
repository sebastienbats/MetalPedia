#!/usr/bin/env python3
"""
Enrichit les albums (année, image, URI, TYPE) via le cache Discogs.
Filtre strictement les "Master Releases" via l'API Discogs.
Version corrigée : gestion correcte des formats renvoyés sous forme de chaîne.
"""
import argparse
import json
import os
import re
import time
import requests
from pathlib import Path
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

API_URL = "https://api.discogs.com/"
DISCOGS_CACHE_FILE = Path("../data/discogs_cache.json")
MASTERS_CACHE_FILE = Path("../data/discogs_masters_cache.json")
DISCOGS_DELAY = 1.1

FORMAT_TO_TYPE = {
    'lp': 'album', 'album': 'album', 'cd': 'album', 'cassette': 'album',
    'sacd': 'album', 'hybrid': 'album', 'file': 'album',
    'ep': 'ep', 'mini-album': 'ep',
    'single': 'single', '7"': 'single', '10"': 'single', '12"': 'single',
    'flexi-disc': 'single', 'promo': 'single', 'test pressing': 'single',
    'compilation': 'compilation', 'best of': 'compilation', 'greatest hits': 'compilation',
    'reissue': 'compilation', 'remastered': 'compilation', 'anthology': 'compilation',
    'retrospective': 'compilation', 'collection': 'compilation',
    'live': 'live',
    'dvd': 'video', 'dvd-video': 'video', 'blu-ray': 'video', 'vhs': 'video',
    'laserdisc': 'video', 'video': 'video',
    'box set': 'box_set', 'boxset': 'box_set',
    'miscellaneous': 'misc', 'mixed': 'misc',
}

def normalize_title(title: str) -> str:
    if not title: return ""
    t = title.lower().strip()
    t = re.sub(r"\([^)]*\)", " ", t)
    t = re.sub(r"\[[^\]]*\]", " ", t)
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def infer_type_from_formats(formats) -> str:
    """Déduit le type d'album à partir des formats Discogs (chaîne ou liste)."""
    if not formats:
        return None
    
    all_format_names = []
    
    # ✨ CORRECTION : Si c'est une chaîne, on la met dans une liste pour itérer correctement
    if isinstance(formats, str):
        formats = [formats]
        
    for fmt in formats:
        if isinstance(fmt, dict):
            name = (fmt.get('name') or '').lower()
            descriptions = fmt.get('descriptions') or []
            if name: all_format_names.append(name)
            for desc in descriptions:
                all_format_names.append(desc.lower())
        elif isinstance(fmt, str):
            all_format_names.append(fmt.lower())
    
    if not all_format_names:
        return None
    
    # Détection par priorité
    if any(f in FORMAT_TO_TYPE and FORMAT_TO_TYPE[f] == 'single' for f in all_format_names):
        return 'single'
    if any(f in FORMAT_TO_TYPE and FORMAT_TO_TYPE[f] == 'ep' for f in all_format_names):
        return 'ep'
    if any('live' in f for f in all_format_names):
        return 'live'
    if any(f in FORMAT_TO_TYPE and FORMAT_TO_TYPE[f] == 'video' for f in all_format_names):
        return 'video'
    if any(f in FORMAT_TO_TYPE and FORMAT_TO_TYPE[f] == 'box_set' for f in all_format_names):
        return 'box_set'
    if any(f in FORMAT_TO_TYPE and FORMAT_TO_TYPE[f] == 'compilation' for f in all_format_names):
        return 'compilation'
    if any(f in FORMAT_TO_TYPE and FORMAT_TO_TYPE[f] == 'album' for f in all_format_names):
        return 'album'
    
    return None

def load_json_cache(file_path: Path) -> dict:
    if file_path.exists():
        try: return json.loads(file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError: return {}
    return {}

def save_cache(file_path: Path, cache: dict):
    file_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = file_path.with_suffix(".tmp")
    tmp.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    tmp.replace(file_path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true", help="Force le remplacement des types existants")
    args = parser.parse_args()

    token = os.getenv("DISCOGS_TOKEN")
    if not token: raise SystemExit("❌ DISCOGS_TOKEN manquant dans .env")

    src = Path(args.input)
    if not src.exists(): raise SystemExit(f"❌ Fichier introuvable : {src}")

    data = json.loads(src.read_text(encoding="utf-8"))
    bands = data.get("bands", data) if isinstance(data, dict) else data

    artist_cache = load_json_cache(DISCOGS_CACHE_FILE)
    masters_cache = load_json_cache(MASTERS_CACHE_FILE)

    session = requests.Session()
    session.headers.update({
        "User-Agent": "MetalPedia/1.0",
        "Authorization": f"Discogs token={token}"
    })

    total_albums = sum(len(b.get("albums", [])) for b in bands)
    
    type_counts_before = {}
    for b in bands:
        for a in b.get("albums", []):
            t = a.get("type") or "null"
            type_counts_before[t] = type_counts_before.get(t, 0) + 1

    print(f"📂 {len(bands)} groupes / {total_albums:,} albums")
    print(f"💾 Cache artistes : {len(artist_cache):,} | Cache masters : {len(masters_cache):,}")
    print(f"📊 Répartition actuelle des types : {type_counts_before}")
    print(f"🧪 Mode : {'DRY RUN' if args.dry_run else 'Écriture'} | Force : {'OUI' if args.force else 'NON'}\n")

    years_added = images_added = uris_added = types_added = api_requests = 0

    for band in tqdm(bands, desc="Enrichissement"):
        band_name = band.get("name", "").strip()
        albums = band.get("albums", [])
        if not band_name or not albums: continue

        cache_key = f"artist:{band_name.lower().strip()}"
        artist_data = artist_cache.get(cache_key)
        discogs_id = artist_data.get("discogs_id") if isinstance(artist_data, dict) else None
        if not discogs_id: continue

        releases = []
        for page in range(1, 6):
            try:
                time.sleep(DISCOGS_DELAY)
                resp = session.get(f"{API_URL}artists/{discogs_id}/releases",
                                   params={"type": "master", "per_page": 100, "page": page, "sort": "year", "sort_order": "desc"},
                                   timeout=25)
                api_requests += 1
                if resp.status_code == 200:
                    data_resp = resp.json()
                    releases.extend(data_resp.get("releases", []))
                    if page >= data_resp.get("pagination", {}).get("pages", 1): break
                elif resp.status_code == 429: time.sleep(60)
                else: break
            except requests.RequestException: break

        if not releases: continue

        master_releases = {}
        for rel in releases:
            title = rel.get("title", "")
            if " - " in title: title = title.split(" - ", 1)[1]
            norm_title = normalize_title(title)
            if norm_title:
                master_releases[norm_title] = {
                    "year": rel.get("year"),
                    "image": rel.get("thumb"),
                    "uri": f"https://www.discogs.com/master/{rel.get('id')}",
                    "id": rel.get("id"),
                    "type": infer_type_from_formats(rel.get("format") or rel.get("formats") or [])
                }

        band_changed = False
        for album in albums:
            album_title = album.get("name") or album.get("title", "")
            if not album_title: continue

            norm_album_title = normalize_title(album_title)
            match = master_releases.get(norm_album_title)
            
            if not match and len(norm_album_title) > 3:
                for m_norm, m_data in master_releases.items():
                    if norm_album_title in m_norm or m_norm in norm_album_title:
                        match = m_data
                        break

            if match:
                changed = False
                
                if not album.get("year") and match.get("year"):
                    album["year"] = match["year"]; years_added += 1; changed = True
                if not album.get("image") and match.get("image"):
                    album["image"] = match["image"]; album["image_source"] = "discogs"; images_added += 1; changed = True

                current_uri = album.get("uri", "")
                if "discogs.com/master/" not in current_uri and match.get("uri"):
                    album["uri"] = match["uri"]; uris_added += 1; changed = True

                current_type = album.get("type")
                inferred_type = match.get("type")
                
                should_replace_type = (
                    args.force or
                    not current_type or
                    (current_type == "album" and inferred_type and inferred_type != "album")
                )
                
                if should_replace_type and inferred_type:
                    album["type"] = inferred_type
                    album["type_source"] = "discogs"
                    types_added += 1
                    changed = True

                if changed:
                    band_changed = True
                    mid = str(match["id"])
                    if mid not in masters_cache:
                        masters_cache[mid] = {"year": match["year"], "image": match["image"], "type": match["type"]}

        if band_changed and len(masters_cache) % 500 == 0:
            save_cache(MASTERS_CACHE_FILE, masters_cache)

    save_cache(MASTERS_CACHE_FILE, masters_cache)

    type_counts_after = {}
    for b in bands:
        for a in b.get("albums", []):
            t = a.get("type") or "null"
            type_counts_after[t] = type_counts_after.get(t, 0) + 1

    print("\n" + "=" * 70)
    print("📊 RÉSULTATS")
    print("=" * 70)
    print(f"  Requêtes API         : {api_requests:,}")
    print(f"  ✅ Années ajoutées    : {years_added:,}")
    print(f"  🖼️  Images ajoutées    : {images_added:,}")
    print(f"  🔗 URIs ajoutées      : {uris_added:,}")
    print(f"  🏷️  Types ajoutés      : {types_added:,}")
    print(f"\n📈 Répartition finale des types :")
    for t, count in sorted(type_counts_after.items(), key=lambda x: -x[1]):
        pct = 100 * count / max(total_albums, 1)
        print(f"   {t:15s} : {count:>8,} ({pct:5.1f}%)")

    if args.dry_run:
        print("\n✅ DRY RUN : aucun fichier écrit.")
        return

    out = Path(args.output) if args.output else src.with_name(src.stem + "_typed.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp")
    tmp.write_text(json.dumps({"bands": bands} if isinstance(data, dict) else bands, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(out)
    print(f"\n✅ Sauvegardé dans : {out}")

if __name__ == "__main__":
    main()
