#!/usr/bin/env python3
"""
Enrichit les albums EXISTANTS avec années + images via stratégie multi-sources :
1. MusicBrainz (MBID → first-release-date) : rapide et fiable pour les années
2. MusicBrainz (MBID → url-rels → URI Discogs) : pour trouver le lien Discogs
3. Discogs (URI directe ou via MB) : pour années + images HD

✨ OPTIMISATION : Réutilise les caches de fetch_metal_bands.py
   - ../data/mbid_cache.json (MusicBrainz)
   - ../data/discogs_cache.json + ../data/tracklist_cache.json (Discogs)

Prérequis : DISCOGS_TOKEN dans .env (optionnel si --skip-discogs)
Usage :
python enrich_albums.py --input ../data/metal_bands.json --dry-run
python enrich_albums.py --input ../data/metal_bands.json --output ../data/metal_bands_enriched.json
python enrich_albums.py --input ../data/metal_bands.json --pillar "Black Metal" --max-albums 25
python enrich_albums.py --input ../data/metal_bands.json --skip-discogs  # MB uniquement
python enrich_albums.py --input ../data/metal_bands.json --refresh       # ignore les caches
"""
import argparse
import json
import os
import re
import time
from pathlib import Path
from typing import Dict, Optional
import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MUSICBRAINZ_API_URL = "https://musicbrainz.org/ws/2/"
DISCOGS_API_URL = "https://api.discogs.com/"

# ✨ CACHES PARTAGÉS avec fetch_metal_bands.py
MB_CACHE_FILE = Path("../data/mbid_cache.json")                    # Partagé
DISCOGS_CACHE_FILE = Path("../data/discogs_cache.json")            # Partagé
TRACKLIST_CACHE_FILE = Path("../data/tracklist_cache.json")        # Partagé

# ✨ CACHES SPÉCIFIQUES à enrich_albums.py (pour les données d'enrichissement)
MB_ENRICH_CACHE_FILE = Path("../data/mb_enrichment_cache.json")
DISCOGS_MASTERS_CACHE_FILE = Path("../data/discogs_masters_cache.json")

MB_DELAY = 1.1       # ~55 req/min
DISCOGS_DELAY = 1.1  # ~55 req/min

# ═══════════════════════════════════════════════════════════
# PILIERS
# ═══════════════════════════════════════════════════════════
GENRE_TO_PILLAR = {
    "folk metal": "Folk Metal", "viking metal": "Folk Metal", "pagan metal": "Folk Metal",
    "black metal": "Black Metal", "norwegian black metal": "Black Metal",
    "symphonic black metal": "Black Metal", "melodic black metal": "Black Metal",
    "death metal": "Death Metal", "melodic death metal": "Death Metal",
    "brutal death metal": "Death Metal", "technical death metal": "Death Metal",
    "grindcore": "Death Metal", "goregrind": "Death Metal",
    "pornogrind": "Death Metal", "noisecore": "Death Metal",
    "thrash metal": "Thrash Metal", "speed metal": "Thrash Metal",
    "groove metal": "Thrash Metal", "crossover thrash": "Thrash Metal",
    "power metal": "Power Metal", "epic metal": "Power Metal",
    "symphonic metal": "Power Metal",
    "doom metal": "Doom Metal", "sludge metal": "Doom Metal",
    "stoner metal": "Doom Metal", "gothic metal": "Doom Metal",
    "progressive metal": "Progressive Metal", "post-metal": "Progressive Metal",
    "djent": "Progressive Metal",
    "metalcore": "Metalcore", "melodic metalcore": "Metalcore",
    "deathcore": "Metalcore", "nu metal": "Metalcore", "mathcore": "Metalcore",
    "heavy metal": "Heavy Metal", "true metal": "Heavy Metal",
    "metal": "Heavy Metal", "glam metal": "Heavy Metal",
}

def pillar_of(band: Dict) -> str:
    raw = (band.get("genre_pillar") or band.get("genre") or "").strip().lower()
    return GENRE_TO_PILLAR.get(raw, "Heavy Metal")

# ═══════════════════════════════════════════════════════════
# CLIENT MUSICBRAINZ (avec réutilisation du cache global)
# ═══════════════════════════════════════════════════════════
class MusicBrainzEnricher:
    """Client MusicBrainz qui exploite le cache global mbid_cache.json."""
    
    def __init__(self, use_cache: bool = True, refresh: bool = False):
        self.use_cache = use_cache
        self.refresh = refresh
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "MetalPedia/1.0 ( https://github.com/sebastienbats/MetalPedia ; mailto:contact@metalpedia.dev )",
            "Accept": "application/json",
        })
        
        # ✨ Charge le cache GLOBAL de fetch_metal_bands.py
        self.global_cache: Dict = {}
        # ✨ Cache spécifique pour les données d'enrichissement
        self.enrich_cache: Dict = {}
        
        self.stats = {
            "api_requests": 0,
            "global_cache_hits": 0,       # Données trouvées dans mbid_cache.json
            "enrich_cache_hits": 0,       # Données trouvées dans mb_enrichment_cache.json
            "cache_misses": 0,
            "years_found": 0,
            "years_not_found": 0,
            "uris_found": 0,
            "uris_not_found": 0,
            "errors": 0,
        }
        self._load_caches()

    def _load_caches(self):
        if not self.use_cache:
            return
        
        # ✨ Charge le cache global (partagé avec fetch_metal_bands.py)
        if MB_CACHE_FILE.exists():
            try:
                self.global_cache = json.loads(MB_CACHE_FILE.read_text(encoding="utf-8"))
                print(f"💾 Cache MB global chargé : {len(self.global_cache):,} entrées (de fetch_metal_bands.py)")
            except json.JSONDecodeError:
                self.global_cache = {}
        
        # ✨ Charge le cache spécifique d'enrichissement
        if MB_ENRICH_CACHE_FILE.exists():
            try:
                self.enrich_cache = json.loads(MB_ENRICH_CACHE_FILE.read_text(encoding="utf-8"))
                print(f"💾 Cache MB enrichissement chargé : {len(self.enrich_cache):,} entrées")
            except json.JSONDecodeError:
                self.enrich_cache = {}

    def save_caches(self):
        if not self.use_cache:
            return
        
        # Sauvegarde le cache global (partagé)
        MB_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        tmp = MB_CACHE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.global_cache, ensure_ascii=False), encoding="utf-8")
        tmp.replace(MB_CACHE_FILE)
        
        # Sauvegarde le cache spécifique
        tmp = MB_ENRICH_CACHE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.enrich_cache, ensure_ascii=False), encoding="utf-8")
        tmp.replace(MB_ENRICH_CACHE_FILE)

    def _request(self, url: str) -> Optional[Dict]:
        for attempt in range(3):
            try:
                time.sleep(MB_DELAY)
                response = self.session.get(url, timeout=15)
                self.stats["api_requests"] += 1
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    return None
                elif response.status_code in (400, 401, 403, 405, 406):
                    return None
                elif response.status_code in (408, 413, 429, 500, 502, 503, 504):
                    wait = int(response.headers.get("Retry-After", "5"))
                    time.sleep(wait * (attempt + 1))
                    continue
                else:
                    return None
            except requests.RequestException as e:
                self.stats["errors"] += 1
                if attempt < 2:
                    time.sleep(2 * (attempt + 1))
                else:
                    print(f"\n❌ Erreur MB {url}: {e}")
                return None
        return None

    def get_year_from_mbid(self, mbid: str) -> Optional[int]:
        """✨ Récupère l'année via MBID avec fallback release-group → release."""
        if not mbid:
            return None
        
        # ✨ ÉTAPE 1 : Cache spécifique enrichissement
        if not self.refresh and mbid in self.enrich_cache:
            cached_year = self.enrich_cache[mbid].get("year")
            if cached_year is not None:
                self.stats["enrich_cache_hits"] += 1
                if cached_year:
                    self.stats["years_found"] += 1
                else:
                    self.stats["years_not_found"] += 1
                return cached_year
        
        # ✨ ÉTAPE 2 : Cache global (rg_year:{mbid}) de fetch_metal_bands.py
        if not self.refresh:
            rg_year_key = f"rg_year:{mbid}"
            if rg_year_key in self.global_cache:
                self.stats["global_cache_hits"] += 1
                year = self.global_cache[rg_year_key].get("year")
                # Mettre en cache dans enrich_cache pour accès futur rapide
                if mbid not in self.enrich_cache:
                    self.enrich_cache[mbid] = {"year": year, "discogs_uri": None}
                if year:
                    self.stats["years_found"] += 1
                else:
                    self.stats["years_not_found"] += 1
                return year
        
        self.stats["cache_misses"] += 1
        
        # ✨ ÉTAPE 3 : Requête API avec fallback
        year = None
        
        # Essayer release-group
        data_rg = self._request(f"{MUSICBRAINZ_API_URL}release-group/{mbid}?fmt=json")
        if data_rg:
            date_str = data_rg.get("first-release-date") or data_rg.get("date")
            if date_str and len(date_str) >= 4:
                try:
                    y = int(date_str[:4])
                    if 1960 <= y <= 2100:
                        year = y
                except ValueError:
                    pass
        
        # Fallback : essayer release
        if year is None:
            data_r = self._request(f"{MUSICBRAINZ_API_URL}release/{mbid}?fmt=json")
            if data_r:
                date_str = data_r.get("date") or data_r.get("first-release-date")
                if date_str and len(date_str) >= 4:
                    try:
                        y = int(date_str[:4])
                        if 1960 <= y <= 2100:
                            year = y
                    except ValueError:
                        pass
        
        # Mettre en cache
        if mbid not in self.enrich_cache:
            self.enrich_cache[mbid] = {"year": None, "discogs_uri": None}
        self.enrich_cache[mbid]["year"] = year
        
        # Mettre aussi dans le cache global pour fetch_metal_bands.py
        self.global_cache[f"rg_year:{mbid}"] = {"year": year}
        
        if year:
            self.stats["years_found"] += 1
        else:
            self.stats["years_not_found"] += 1
        
        # Sauvegarde périodique
        if len(self.enrich_cache) % 100 == 0:
            self.save_caches()
        
        return year

    def get_discogs_uri_from_mbid(self, mbid: str) -> Optional[str]:
        """✨ Récupère l'URI Discogs via MBID + inc=url-rels."""
        if not mbid:
            return None
        
        # ✨ ÉTAPE 1 : Cache spécifique enrichissement
        if not self.refresh and mbid in self.enrich_cache:
            cached_uri = self.enrich_cache[mbid].get("discogs_uri")
            if cached_uri is not None:
                self.stats["enrich_cache_hits"] += 1
                if cached_uri:
                    self.stats["uris_found"] += 1
                else:
                    self.stats["uris_not_found"] += 1
                return cached_uri
        
        # ✨ ÉTAPE 2 : Cache global (rg_discogs_uri:{mbid}) de fetch_metal_bands.py
        if not self.refresh:
            rg_uri_key = f"rg_discogs_uri:{mbid}"
            if rg_uri_key in self.global_cache:
                self.stats["global_cache_hits"] += 1
                uri = self.global_cache[rg_uri_key].get("uri")
                if mbid not in self.enrich_cache:
                    self.enrich_cache[mbid] = {"year": None, "discogs_uri": None}
                self.enrich_cache[mbid]["discogs_uri"] = uri
                if uri:
                    self.stats["uris_found"] += 1
                else:
                    self.stats["uris_not_found"] += 1
                return uri
        
        self.stats["cache_misses"] += 1
        
        # ✨ ÉTAPE 3 : Requête API avec fallback
        uri = None
        
        # Essayer release-group
        data_rg = self._request(f"{MUSICBRAINZ_API_URL}release-group/{mbid}?inc=url-rels&fmt=json")
        if data_rg:
            for rel in data_rg.get("relations", []):
                if rel.get("type") == "discogs" and "resource" in rel.get("url", {}):
                    uri = rel["url"]["resource"]
                    break
        
        # Fallback : essayer release
        if not uri:
            data_r = self._request(f"{MUSICBRAINZ_API_URL}release/{mbid}?inc=url-rels&fmt=json")
            if data_r:
                for rel in data_r.get("relations", []):
                    if rel.get("type") == "discogs" and "resource" in rel.get("url", {}):
                        uri = rel["url"]["resource"]
                        break
        
        # Mettre en cache
        if mbid not in self.enrich_cache:
            self.enrich_cache[mbid] = {"year": None, "discogs_uri": None}
        self.enrich_cache[mbid]["discogs_uri"] = uri
        
        # Mettre aussi dans le cache global
        self.global_cache[f"rg_discogs_uri:{mbid}"] = {"uri": uri}
        
        if uri:
            self.stats["uris_found"] += 1
        else:
            self.stats["uris_not_found"] += 1
        
        return uri

# ═══════════════════════════════════════════════════════════
# CLIENT DISCOGS (avec réutilisation du cache global)
# ═══════════════════════════════════════════════════════════
class DiscogsMasterClient:
    """Client Discogs qui exploite les caches globaux."""
    
    def __init__(self, token: str, use_cache: bool = True, refresh: bool = False):
        self.token = token
        self.use_cache = use_cache
        self.refresh = refresh
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "MetalPedia/1.0 (https://metalpedia.vercel.app)",
            "Authorization": f"Discogs token={token}",
        })
        
        # ✨ Cache global (partagé avec fetch_metal_bands.py)
        self.global_cache: Dict = {}
        self.tracklist_cache: Dict = {}
        # ✨ Cache spécifique pour les masters
        self.masters_cache: Dict = {}
        
        self.stats = {
            "cache_hits": 0,
            "global_cache_hits": 0,
            "cache_misses": 0,
            "api_requests": 0,
            "rate_limits": 0,
            "not_found": 0,
            "errors": 0,
        }
        self._load_caches()

    def _load_caches(self):
        if not self.use_cache:
            return
        
        # ✨ Charge le cache global Discogs
        if DISCOGS_CACHE_FILE.exists():
            try:
                self.global_cache = json.loads(DISCOGS_CACHE_FILE.read_text(encoding="utf-8"))
                print(f"💾 Cache Discogs global chargé : {len(self.global_cache):,} entrées")
            except json.JSONDecodeError:
                self.global_cache = {}
        
        # ✨ Charge le cache tracklist (contient les masters)
        if TRACKLIST_CACHE_FILE.exists():
            try:
                self.tracklist_cache = json.loads(TRACKLIST_CACHE_FILE.read_text(encoding="utf-8"))
                print(f"💾 Cache tracklist chargé : {len(self.tracklist_cache):,} entrées")
            except json.JSONDecodeError:
                self.tracklist_cache = {}
        
        # ✨ Charge le cache spécifique masters
        if DISCOGS_MASTERS_CACHE_FILE.exists():
            try:
                self.masters_cache = json.loads(DISCOGS_MASTERS_CACHE_FILE.read_text(encoding="utf-8"))
                print(f"💾 Cache Discogs masters chargé : {len(self.masters_cache):,} entrées")
            except json.JSONDecodeError:
                self.masters_cache = {}

    def save_caches(self):
        if not self.use_cache:
            return
        
        # Sauvegarde le cache global
        DISCOGS_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        tmp = DISCOGS_CACHE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.global_cache, ensure_ascii=False), encoding="utf-8")
        tmp.replace(DISCOGS_CACHE_FILE)
        
        # Sauvegarde le cache tracklist
        tmp = TRACKLIST_CACHE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.tracklist_cache, ensure_ascii=False), encoding="utf-8")
        tmp.replace(TRACKLIST_CACHE_FILE)
        
        # Sauvegarde le cache masters
        tmp = DISCOGS_MASTERS_CACHE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.masters_cache, ensure_ascii=False), encoding="utf-8")
        tmp.replace(DISCOGS_MASTERS_CACHE_FILE)

    def _request(self, master_id: str) -> Optional[Dict]:
        for attempt in range(4):
            try:
                time.sleep(DISCOGS_DELAY)
                resp = self.session.get(f"{DISCOGS_API_URL}masters/{master_id}", timeout=25)
                self.stats["api_requests"] += 1
                
                if resp.status_code == 200:
                    return resp.json()
                if resp.status_code == 404:
                    self.stats["not_found"] += 1
                    return None
                if resp.status_code == 429:
                    self.stats["rate_limits"] += 1
                    wait = int(resp.headers.get("Retry-After", "60"))
                    print(f"\n⏱  Rate limit Discogs, attente {wait}s")
                    time.sleep(wait)
                    continue
                if resp.status_code in (500, 502, 503, 504):
                    time.sleep(5 * (attempt + 1))
                    continue
                return None
            except requests.RequestException as e:
                self.stats["errors"] += 1
                if attempt < 3:
                    time.sleep(3 * (attempt + 1))
                else:
                    print(f"\n❌ Erreur réseau master {master_id}: {e}")
                return None

    def get_master_data(self, master_id: str) -> Optional[Dict]:
        """✨ Récupère les données d'un master avec cascade de caches."""
        
        # ✨ ÉTAPE 1 : Cache spécifique masters
        if not self.refresh and master_id in self.masters_cache:
            self.stats["cache_hits"] += 1
            return self.masters_cache[master_id]
        
        # ✨ ÉTAPE 2 : Cache tracklist (master:{id} de fetch_metal_bands.py)
        if not self.refresh:
            tracklist_key = f"master:{master_id}"
            if tracklist_key in self.tracklist_cache:
                self.stats["global_cache_hits"] += 1
                cached_data = self.tracklist_cache[tracklist_key]
                # Extraire les données utiles
                result = {
                    "year": cached_data.get("year"),
                    "image": None,
                }
                images = cached_data.get("images", [])
                if images:
                    primary = next((img for img in images if img.get("type") == "primary"), images[0])
                    result["image"] = primary.get("uri") or primary.get("resource_url")
                
                # Mettre en cache spécifique pour accès futur rapide
                self.masters_cache[master_id] = result
                return result
        
        self.stats["cache_misses"] += 1
        
        # ✨ ÉTAPE 3 : Requête API
        data = self._request(master_id)
        if data is None:
            self.masters_cache[master_id] = None
            self.tracklist_cache[f"master:{master_id}"] = None  # Synchroniser
            return None
        
        result = {
            "year": data.get("year"),
            "image": None,
        }
        
        images = data.get("images", [])
        if images:
            primary = next((img for img in images if img.get("type") == "primary"), images[0])
            result["image"] = primary.get("uri") or primary.get("resource_url")
        
        # Mettre en cache dans les deux endroits (synchronisation)
        self.masters_cache[master_id] = result
        self.tracklist_cache[f"master:{master_id}"] = data  # Données complètes
        
        # Sauvegarde périodique
        if len(self.masters_cache) % 50 == 0:
            self.save_caches()
        
        return result

# ═══════════════════════════════════════════════════════════
# EXTRACTION DU MASTER ID
# ═══════════════════════════════════════════════════════════
def extract_master_id(uri: str) -> Optional[str]:
    if not uri or not isinstance(uri, str):
        return None
    match = re.search(r'/master/(\d+)', uri)
    return match.group(1) if match else None

# ═══════════════════════════════════════════════════════════
# STATISTIQUES
# ═══════════════════════════════════════════════════════════
def calculate_album_stats(bands: list) -> Dict:
    total = 0
    with_year = 0
    with_image = 0
    with_uri = 0
    with_mbid = 0
    with_discogs_uri = 0
    year_sources = {"musicbrainz": 0, "discogs": 0, "none": 0}
    
    for band in bands:
        for album in band.get("albums", []):
            total += 1
            if album.get("year"):
                with_year += 1
                src = album.get("year_source", "none")
                if src in year_sources:
                    year_sources[src] += 1
                else:
                    year_sources["none"] += 1
            else:
                year_sources["none"] += 1
            if album.get("image"):
                with_image += 1
            if album.get("uri"):
                with_uri += 1
            if album.get("mbid"):
                with_mbid += 1
            if "discogs.com/master/" in (album.get("uri") or ""):
                with_discogs_uri += 1
    
    return {
        "total": total,
        "with_year": with_year,
        "with_image": with_image,
        "with_uri": with_uri,
        "with_mbid": with_mbid,
        "with_discogs_uri": with_discogs_uri,
        "year_sources": year_sources,
    }

def print_stats(stats: Dict, title: str):
    total = stats["total"]
    print(f"\n{title}")
    print("-" * 70)
    print(f"💿 ALBUMS ({total:,})")
    print(f"   Années          : {stats['with_year']:>8,} ({100 * stats['with_year'] / max(total, 1):5.1f}%)")
    print(f"     ├─ MB         : {stats['year_sources']['musicbrainz']:>8,}")
    print(f"     ├─ Discogs    : {stats['year_sources']['discogs']:>8,}")
    print(f"     └─ manquantes : {stats['year_sources']['none']:>8,}")
    print(f"   Images          : {stats['with_image']:>8,} ({100 * stats['with_image'] / max(total, 1):5.1f}%)")
    print(f"   URI (toutes)    : {stats['with_uri']:>8,} ({100 * stats['with_uri'] / max(total, 1):5.1f}%)")
    print(f"   URI Discogs     : {stats['with_discogs_uri']:>8,} ({100 * stats['with_discogs_uri'] / max(total, 1):5.1f}%)")
    print(f"   MBID            : {stats['with_mbid']:>8,} ({100 * stats['with_mbid'] / max(total, 1):5.1f}%)")

def print_comparison(before: Dict, after: Dict):
    print("\n📈 AMÉLIORATIONS")
    print("-" * 70)
    years_added = after["with_year"] - before["with_year"]
    images_added = after["with_image"] - before["with_image"]
    uris_added = after["with_discogs_uri"] - before["with_discogs_uri"]
    mb_years = after["year_sources"]["musicbrainz"] - before["year_sources"]["musicbrainz"]
    dg_years = after["year_sources"]["discogs"] - before["year_sources"]["discogs"]
    
    if years_added > 0:
        print(f"   ✅ Années ajoutées      : +{years_added:,}")
        print(f"      ├─ via MusicBrainz   : +{mb_years:,}")
        print(f"      └─ via Discogs       : +{dg_years:,}")
    if images_added > 0:
        print(f"   ✅ Images ajoutées      : +{images_added:,}")
    if uris_added > 0:
        print(f"   ✅ URI Discogs ajoutées : +{uris_added:,}")
    if years_added == 0 and images_added == 0 and uris_added == 0:
        print("   ⚠️  Aucune amélioration détectée")

def print_client_stats(mb_client: Optional[MusicBrainzEnricher], discogs_client: Optional[DiscogsMasterClient]):
    print("\n🔧 STATISTIQUES CLIENTS")
    print("-" * 70)
    
    if mb_client:
        print("📊 MusicBrainz :")
        print(f"   Requêtes API         : {mb_client.stats['api_requests']:,}")
        print(f"   Global cache hits    : {mb_client.stats['global_cache_hits']:,}  ← depuis fetch_metal_bands.py")
        print(f"   Enrich cache hits    : {mb_client.stats['enrich_cache_hits']:,}")
        print(f"   Cache misses         : {mb_client.stats['cache_misses']:,}")
        print(f"   Années trouvées      : {mb_client.stats['years_found']:,}")
        print(f"   Années non trouvées  : {mb_client.stats['years_not_found']:,}")
        print(f"   URI Discogs trouvées : {mb_client.stats['uris_found']:,}")
        print(f"   URI Discogs absentes : {mb_client.stats['uris_not_found']:,}")
        print(f"   Erreurs              : {mb_client.stats['errors']:,}")
        print(f"   Taille cache global  : {len(mb_client.global_cache):,}")
        print(f"   Taille cache enrich  : {len(mb_client.enrich_cache):,}")
    
    if discogs_client:
        print("\n💿 Discogs :")
        print(f"   Requêtes API         : {discogs_client.stats['api_requests']:,}")
        print(f"   Global cache hits    : {discogs_client.stats['global_cache_hits']:,}  ← depuis fetch_metal_bands.py")
        print(f"   Masters cache hits   : {discogs_client.stats['cache_hits']:,}")
        print(f"   Cache misses         : {discogs_client.stats['cache_misses']:,}")
        print(f"   Rate limits          : {discogs_client.stats['rate_limits']:,}")
        print(f"   Non trouvés          : {discogs_client.stats['not_found']:,}")
        print(f"   Erreurs              : {discogs_client.stats['errors']:,}")
        print(f"   Taille cache global  : {len(discogs_client.global_cache):,}")
        print(f"   Taille cache masters : {len(discogs_client.masters_cache):,}")
        print(f"   Taille tracklist     : {len(discogs_client.tracklist_cache):,}")

# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(
        description="Enrichit les albums via MusicBrainz + Discogs (avec réutilisation des caches).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--input", required=True, help="JSON source des groupes")
    parser.add_argument("--output", default=None, help="JSON de destination")
    parser.add_argument("--pillar", default=None, help='Filtrer par pilier (ex: "Folk Metal")')
    parser.add_argument("--max-albums", type=int, default=0,
                        help="Max d'albums à enrichir par groupe (0 = tous)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Max de groupes à traiter (0 = tous)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Affiche les correspondances sans écrire")
    parser.add_argument("--refresh", action="store_true",
                        help="Ignore TOUS les caches (MB et Discogs)")
    parser.add_argument("--skip-discogs", action="store_true",
                        help="N'utilise que MusicBrainz (plus rapide, pas d'images)")
    args = parser.parse_args()

    # Vérifier le token Discogs
    discogs_token = os.getenv("DISCOGS_TOKEN")
    if not args.skip_discogs and not discogs_token:
        raise SystemExit("❌ DISCOGS_TOKEN manquant dans .env (ou utilisez --skip-discogs)")

    # Charger le fichier source
    src = Path(args.input)
    if not src.exists():
        raise SystemExit(f"❌ Fichier introuvable : {src}")
    data = json.loads(src.read_text(encoding="utf-8"))
    bands = data.get("bands", []) if isinstance(data, dict) else data

    # Filtrer par pilier
    if args.pillar:
        wanted = args.pillar.strip().lower()
        bands = [b for b in bands if pillar_of(b).lower() == wanted]

    # Limiter le nombre de groupes
    if args.limit > 0:
        bands = bands[:args.limit]

    # Statistiques AVANT
    before_stats = calculate_album_stats(bands)
    print(f"🎯 Pillier : {args.pillar or 'tous'}")
    print(f"📂 {len(bands)} groupes / {before_stats['total']:,} albums")
    print(f"🧪 Mode : {'DRY RUN' if args.dry_run else 'Écriture'}")
    print(f"🔧 Sources : {'MB+Discogs' if not args.skip_discogs else 'MB uniquement'}")
    print(f"✨ Réutilisation des caches de fetch_metal_bands.py : {'OUI' if not args.refresh else 'NON (--refresh)'}")
    print_stats(before_stats, "📊 STATISTIQUES AVANT ENRICHISSEMENT")

    # Initialiser les clients
    mb_client = MusicBrainzEnricher(use_cache=True, refresh=args.refresh)
    discogs_client = None if args.skip_discogs else DiscogsMasterClient(discogs_token, use_cache=True, refresh=args.refresh)

    # ═══════════════════════════════════════════════════════
    # ENRICHISSEMENT
    # ═══════════════════════════════════════════════════════
    years_added_mb = 0
    years_added_discogs = 0
    images_added = 0
    uris_added = 0
    albums_processed = 0
    albums_skipped = 0
    bands_with_changes = 0

    for band in tqdm(bands, desc="Enrichissement"):
        albums = band.get("albums", [])
        if not albums:
            continue

        targets = albums[:args.max_albums] if args.max_albums > 0 else albums
        band_changed = False

        for album in targets:
            mbid = album.get("mbid", "")
            if not mbid:
                albums_skipped += 1
                continue

            albums_processed += 1
            album_changed = False

            # ═══════════════════════════════════════════════
            # ÉTAPE 1 : Année via MusicBrainz
            # ═══════════════════════════════════════════════
            if not album.get("year"):
                year = mb_client.get_year_from_mbid(mbid)
                if year:
                    album["year"] = year
                    album["year_source"] = "musicbrainz"
                    years_added_mb += 1
                    album_changed = True

            # ═══════════════════════════════════════════════
            # ÉTAPE 2 : URI Discogs via MusicBrainz
            # ═══════════════════════════════════════════════
            if discogs_client:
                uri = album.get("uri", "")
                master_id = extract_master_id(uri)
                
                if not master_id:
                    discogs_uri = mb_client.get_discogs_uri_from_mbid(mbid)
                    if discogs_uri:
                        album["uri"] = discogs_uri
                        uris_added += 1
                        master_id = extract_master_id(discogs_uri)
                        album_changed = True
                
                # ═══════════════════════════════════════════
                # ÉTAPE 3 : Année + Image via Discogs
                # ═══════════════════════════════════════════
                if master_id:
                    master_data = discogs_client.get_master_data(master_id)
                    if master_data:
                        if not album.get("year") and master_data.get("year"):
                            try:
                                album["year"] = int(master_data["year"])
                                album["year_source"] = "discogs"
                                years_added_discogs += 1
                                album_changed = True
                            except (ValueError, TypeError):
                                pass
                        
                        if not album.get("image") and master_data.get("image"):
                            album["image"] = master_data["image"]
                            album["image_source"] = "discogs"
                            images_added += 1
                            album_changed = True

            if album_changed:
                band_changed = True

        if band_changed:
            bands_with_changes += 1

    # Sauvegarder les caches
    mb_client.save_caches()
    if discogs_client:
        discogs_client.save_caches()

    # ═══════════════════════════════════════════════════════
    # RÉSULTATS
    # ═══════════════════════════════════════════════════════
    after_stats = calculate_album_stats(bands)
    print_stats(after_stats, "📊 STATISTIQUES APRÈS ENRICHISSEMENT")
    print_comparison(before_stats, after_stats)
    print_client_stats(mb_client, discogs_client)

    print("\n" + "=" * 70)
    print("📊 RÉSUMÉ")
    print("=" * 70)
    print(f"  Groupes traités           : {len(bands):,}")
    print(f"  Groupes modifiés          : {bands_with_changes:,}")
    print(f"  Albums traités            : {albums_processed:,}")
    print(f"  Albums sans MBID          : {albums_skipped:,}")
    print(f"  ✅ Années ajoutées (MB)    : {years_added_mb:,}")
    print(f"  ✅ Années ajoutées (Discogs): {years_added_discogs:,}")
    print(f"  🖼️  Images ajoutées         : {images_added:,}")
    print(f"  🔗 URI Discogs ajoutées    : {uris_added:,}")

    if args.dry_run:
        print("\n✅ DRY RUN : aucun fichier écrit.")
        print(f"   (les caches ont été sauvegardés)")
        return

    # Sauvegarder le fichier de sortie
    out = Path(args.output) if args.output else src.with_name(src.stem + "_enriched.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp")
    tmp.write_text(
        json.dumps({"bands": bands}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    tmp.replace(out)
    print(f"\n✅ Sauvegardé dans : {out}")

if __name__ == "__main__":
    main()
