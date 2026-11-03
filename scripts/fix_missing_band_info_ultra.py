#!/usr/bin/env python3
"""
Script de rattrapage ULTRA-RÉSILIENT (V5) - Version finale consolidée.

Corrections et améliorations apportées :
  ✅ Résolution correcte du pays via iso-3166-1-codes (plus de villes)
  ✅ Exclusion des codes non-pays (XE, XW, EU, etc.)
  ✅ Ignorance des artistes solos (type="person") pour les dates de formation
  ✅ Caches séparés et atomiques : country_cache.json et formed_cache.json
  ✅ Passe 1: MusicBrainz (Pays)
  ✅ Passe 2: MusicBrainz (Dates)
  ✅ Passe 3: Fallback Discogs (Extraction regex STRICTE depuis le profil texte)
  ✅ Sauvegarde des caches tous les 10 enregistrements (aucune perte en cas de coupure)
  ✅ Délai strict de 2s entre chaque requête avec affichage transparent de la pause
  ✅ Backoff exponentiel 30s → 60s → 120s (3 tentatives max)

Usage :
  python fix_missing_band_info_ultra.py
"""

import json
import time
import re
import os
import requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════

API_DELAY = 2.0           # Délai STRICT entre chaque requête (2s)
BASE_DELAY = 30           # Délai de base pour le backoff exponentiel
MAX_RETRIES = 3           # 3 tentatives maximum
CACHE_SAVE_INTERVAL = 10  # Sauvegarde des caches tous les 10 enregistrements

# Fichiers de cache séparés
COUNTRY_CACHE_FILE = Path("../data/country_cache.json")
FORMED_CACHE_FILE = Path("../data/formed_cache.json")

# Fichier d'entrée / sortie
INPUT_FILE = Path("../data/metal_bands_final_with_types.json")
OUTPUT_FILE = Path("../data/metal_bands_final_complete.json")

# Codes ISO qui ne sont PAS des pays valides
NON_COUNTRY_CODES = {'XE', 'XW', 'XZ', 'EU', 'QU'}

# Mapping ISO → nom de pays (métal-friendly)
ISO_TO_COUNTRY = {
    'US': 'United States', 'GB': 'United Kingdom', 'SE': 'Sweden', 'NO': 'Norway',
    'FI': 'Finland', 'DE': 'Germany', 'FR': 'France', 'CA': 'Canada', 'AU': 'Australia',
    'BR': 'Brazil', 'JP': 'Japan', 'PL': 'Poland', 'RU': 'Russia', 'GR': 'Greece',
    'IT': 'Italy', 'ES': 'Spain', 'PT': 'Portugal', 'NL': 'Netherlands', 'BE': 'Belgium',
    'CH': 'Switzerland', 'AT': 'Austria', 'HU': 'Hungary', 'CZ': 'Czechia', 'RO': 'Romania',
    'UA': 'Ukraine', 'IL': 'Israel', 'TR': 'Turkey', 'MX': 'Mexico', 'AR': 'Argentina',
    'CL': 'Chile', 'CO': 'Colombia', 'CN': 'China', 'KR': 'South Korea', 'IN': 'India',
    'ZA': 'South Africa', 'DK': 'Denmark', 'IS': 'Iceland', 'IE': 'Ireland',
    'TW': 'Taiwan', 'MN': 'Mongolia', 'MD': 'Moldova', 'PE': 'Peru',
    'VE': 'Venezuela', 'UY': 'Uruguay', 'PY': 'Paraguay', 'BO': 'Bolivia', 'EC': 'Ecuador',
    'PA': 'Panama', 'CR': 'Costa Rica', 'GT': 'Guatemala', 'HN': 'Honduras',
    'SV': 'El Salvador', 'NI': 'Nicaragua', 'BZ': 'Belize', 'CU': 'Cuba',
    'DO': 'Dominican Republic', 'HT': 'Haiti', 'JM': 'Jamaica', 'PR': 'Puerto Rico',
    'SG': 'Singapore', 'MY': 'Malaysia', 'ID': 'Indonesia', 'TH': 'Thailand',
    'VN': 'Vietnam', 'PH': 'Philippines', 'KH': 'Cambodia', 'MM': 'Myanmar',
    'BD': 'Bangladesh', 'PK': 'Pakistan', 'LK': 'Sri Lanka', 'NP': 'Nepal',
    'EG': 'Egypt', 'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia',
    'LY': 'Libya', 'SD': 'Sudan', 'ET': 'Ethiopia', 'KE': 'Kenya',
    'NG': 'Nigeria', 'GH': 'Ghana', 'CM': 'Cameroon', 'SN': 'Senegal',
    'SA': 'Saudi Arabia', 'AE': 'United Arab Emirates', 'QA': 'Qatar',
    'KW': 'Kuwait', 'BH': 'Bahrain', 'OM': 'Oman', 'JO': 'Jordan',
    'LB': 'Lebanon', 'SY': 'Syria', 'IQ': 'Iraq', 'IR': 'Iran'
}

# ═══════════════════════════════════════════════════════════
# GESTIONNAIRE DE RATE LIMIT GLOBAL
# ═══════════════════════════════════════════════════════════

_last_request_time = 0

def wait_for_rate_limit():
    """Attend pour respecter strictement le délai de 2s entre chaque requête."""
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < API_DELAY:
        sleep_time = API_DELAY - elapsed
        # ✨ AMÉLIORATION : Affiche la pause pour éviter l'illusion de blocage
        print(f"    ⏳ Respect du rate limit (attente {sleep_time:.1f}s)...", flush=True)
        time.sleep(sleep_time)
    _last_request_time = time.time()

def mb_get(path, headers):
    """GET MusicBrainz en respectant le rate limit global."""
    wait_for_rate_limit()
    try:
        r = requests.get(f"https://musicbrainz.org/ws/2/{path}", headers=headers, timeout=30)
        if r.status_code == 200:
            return r.json()
        return None
    except requests.RequestException:
        return None

def resolve_country(mb_data, headers):
    """Résout le pays de manière fiable via MusicBrainz."""
    code = (mb_data.get('country') or '').upper()
    if len(code) == 2 and code.isalpha() and code not in NON_COUNTRY_CODES:
        return ISO_TO_COUNTRY.get(code, code)

    for key in ('begin-area', 'area'):
        area_id = (mb_data.get(key) or {}).get('id')
        if not area_id:
            continue
        area = mb_get(f"area/{area_id}?fmt=json", headers)
        if not area:
            continue
        codes = area.get('iso-3166-1-codes') or []
        if codes:
            iso = codes[0].upper()
            if iso not in NON_COUNTRY_CODES:
                return ISO_TO_COUNTRY.get(iso, iso)
    return None

def extract_from_discogs_profile(profile: str):
    """
    Extrait le pays et l'année de formation depuis le profil texte Discogs.
    Le pays DOIT être un vrai nom de pays connu pour éviter les villes (ex: "Rexdale").
    Retourne (country, year) ou (None, None) si non trouvé.
    """
    if not profile:
        return None, None
    
    country = None
    year = None
    
    # Ensemble des noms de pays valides pour validation stricte
    valid_countries = set(ISO_TO_COUNTRY.values())
    valid_countries.update(['USA', 'UK', 'Holland', 'The Netherlands', 'Czech Republic'])
    
    # 1. Extraction de l'année (fiable)
    year_patterns = [
        r'formed\s+(?:in\s+)?(\d{4})',
        r'(\d{4})\s*[-–]\s*present',
        r'since\s+(\d{4})',
        r'established\s+(?:in\s+)?(\d{4})'
    ]
    for pattern in year_patterns:
        match = re.search(pattern, profile, re.IGNORECASE)
        if match:
            try:
                y = int(match.group(1))
                if 1960 <= y <= datetime.now().year:
                    year = y
                    break
            except ValueError:
                pass

    # 2. Extraction du pays (STRICTE : on cherche les noms complets dans le texte)
    # On utilise \b pour assurer qu'on matche "Sweden" mais pas "Swedish"
    for c_name in valid_countries:
        if re.search(rf'\b{re.escape(c_name)}\b', profile, re.IGNORECASE):
            country = c_name
            break

    return country, year

# ═══════════════════════════════════════════════════════════
# GESTION DES CACHES
# ═══════════════════════════════════════════════════════════

def load_cache(file_path: Path) -> dict:
    if file_path.exists():
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}

def save_cache(file_path: Path, cache: dict):
    file_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = file_path.with_suffix(".tmp")
    tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(file_path)

# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════

def main():
    if not INPUT_FILE.exists():
        print(f"❌ Fichier introuvable : {INPUT_FILE}")
        return

    print(f"📂 Chargement de {INPUT_FILE}...", flush=True)
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    bands = data.get('bands', data) if isinstance(data, dict) else data

    country_cache = load_cache(COUNTRY_CACHE_FILE)
    formed_cache = load_cache(FORMED_CACHE_FILE)

    print(f"💾 Cache pays chargé     : {len(country_cache):,} entrées", flush=True)
    print(f"💾 Cache dates chargé    : {len(formed_cache):,} entrées", flush=True)

    headers = {'User-Agent': 'MetalPedia/1.0 (contact@metalpedia.dev)'}
    
    # Token Discogs pour la passe 3
    discogs_token = os.getenv("DISCOGS_TOKEN")
    discogs_headers = {'User-Agent': 'MetalPedia/1.0', 'Authorization': f'Discogs token={discogs_token}'} if discogs_token else {}

    stats = {
        'needs_country': 0, 'needs_formed': 0,
        'country_from_cache': 0, 'formed_from_cache': 0,
        'country_fixed_mb': 0, 'formed_fixed_mb': 0,
        'country_fixed_discogs': 0, 'formed_fixed_discogs': 0,
        'country_no_data': 0, 'formed_no_data': 0,
        'person_skipped': 0, 'api_errors': 0,
        'country_skipped': 0, 'formed_skipped': 0
    }

    for band in bands:
        mbid = band.get('mbid')
        if not mbid: continue
        if band.get('country', '') in ['Unknown', None, '']: stats['needs_country'] += 1
        if band.get('formed') is None: stats['needs_formed'] += 1

    print(f"\n🔍 Analyse des besoins :", flush=True)
    print(f"   - Pays manquants/Unknown : {stats['needs_country']:,}", flush=True)
    print(f"   - Années de formation    : {stats['needs_formed']:,}", flush=True)

    # ═══════════════════════════════════════════════════════
    # PASSE 1 : PAYS VIA MUSICBRAINZ
    # ═══════════════════════════════════════════════════════
    print("\n🌍 PASSE 1 : PAYS (MusicBrainz)", flush=True)
    for i, band in enumerate(bands):
        mbid = band.get('mbid')
        if not mbid or band.get('country', '') not in ['Unknown', None, '']: continue
        
        if mbid in country_cache:
            band['country'] = country_cache[mbid]
            band['country_source'] = 'musicbrainz (cache)'
            stats['country_from_cache'] += 1
            continue

        url = f"https://musicbrainz.org/ws/2/artist/{mbid}?fmt=json"
        success = False
        for attempt in range(MAX_RETRIES):
            try:
                wait_for_rate_limit()
                resp = requests.get(url, headers=headers, timeout=30)
                if resp.status_code == 200:
                    mb_data = resp.json()
                    country_value = resolve_country(mb_data, headers)
                    if country_value:
                        band['country'] = country_value
                        band['country_source'] = 'musicbrainz'
                        country_cache[mbid] = country_value
                        stats['country_fixed_mb'] += 1
                    else:
                        stats['country_no_data'] += 1
                    success = True
                    break
                elif resp.status_code in [429, 502, 503, 504]:
                    time.sleep(BASE_DELAY * (2 ** attempt))
                else: 
                    break
            except requests.RequestException:
                time.sleep(BASE_DELAY * (2 ** attempt))
        
        if not success: stats['country_skipped'] += 1
        if (stats['country_fixed_mb'] + stats['country_from_cache']) % CACHE_SAVE_INTERVAL == 0:
            save_cache(COUNTRY_CACHE_FILE, country_cache)

    save_cache(COUNTRY_CACHE_FILE, country_cache)

    # ═══════════════════════════════════════════════════════
    # PASSE 2 : DATES DE FORMATION VIA MUSICBRAINZ
    # ═══════════════════════════════════════════════════════
    print("\n📅 PASSE 2 : DATES DE FORMATION (MusicBrainz)", flush=True)
    for i, band in enumerate(bands):
        mbid = band.get('mbid')
        if not mbid or band.get('formed') is not None: continue
        
        if mbid in formed_cache:
            band['formed'] = formed_cache[mbid].get('formed')
            band['formed_date'] = formed_cache[mbid].get('formed_date')
            band['formed_source'] = 'musicbrainz (cache)'
            stats['formed_from_cache'] += 1
            continue

        url = f"https://musicbrainz.org/ws/2/artist/{mbid}?fmt=json"
        success = False
        for attempt in range(MAX_RETRIES):
            try:
                wait_for_rate_limit()
                resp = requests.get(url, headers=headers, timeout=30)
                if resp.status_code == 200:
                    mb_data = resp.json()
                    if mb_data.get('type') == 'person':
                        stats['person_skipped'] += 1
                        band['formed_source'] = 'not_applicable (solo artist)'
                        success = True
                        break

                    life_span = mb_data.get('life-span', {})
                    begin_date = life_span.get('begin', '')
                    if begin_date:
                        try: year = int(begin_date[:4])
                        except: year = None
                        
                        if year and 1960 <= year <= datetime.now().year:
                            band['formed'] = year
                            band['formed_date'] = begin_date
                            band['formed_source'] = 'musicbrainz'
                            formed_cache[mbid] = {'formed': year, 'formed_date': begin_date}
                            stats['formed_fixed_mb'] += 1
                        else:
                            stats['formed_no_data'] += 1
                    else:
                        stats['formed_no_data'] += 1
                    success = True
                    break
                elif resp.status_code in [429, 502, 503, 504]:
                    time.sleep(BASE_DELAY * (2 ** attempt))
                else: 
                    break
            except requests.RequestException:
                time.sleep(BASE_DELAY * (2 ** attempt))
            
        if not success: stats['formed_skipped'] += 1
        if (stats['formed_fixed_mb'] + stats['formed_from_cache']) % CACHE_SAVE_INTERVAL == 0:
            save_cache(FORMED_CACHE_FILE, formed_cache)

    save_cache(FORMED_CACHE_FILE, formed_cache)

    # ═══════════════════════════════════════════════════════
    # PASSE 3 : FALLBACK DISCOGS (Pour les groupes restants)
    # ═══════════════════════════════════════════════════════
    print("\n🎸 PASSE 3 : FALLBACK DISCOGS (Extraction depuis le profil)", flush=True)
    still_needs_country = sum(1 for b in bands if b.get('country', '') in ['Unknown', None, ''])
    still_needs_formed = sum(1 for b in bands if b.get('formed') is None)
    print(f"   Groupes encore sans pays  : {still_needs_country:,}", flush=True)
    print(f"   Groupes encore sans année : {still_needs_formed:,}", flush=True)
    
    if not discogs_token:
        print("   ⚠️  DISCOGS_TOKEN manquant dans .env, la Passe 3 est ignorée.", flush=True)
    else:
        for i, band in enumerate(bands):
            discogs_id = band.get('discogs_id')
            if not discogs_id: continue
            
            needs_country = band.get('country', '') in ['Unknown', None, '']
            needs_formed = band.get('formed') is None
            
            if not (needs_country or needs_formed): continue
            
            band_name = band.get('name', 'Unknown')
            
            try:
                wait_for_rate_limit()
                resp = requests.get(f"https://api.discogs.com/artists/{discogs_id}", headers=discogs_headers, timeout=30)
                
                if resp.status_code == 200:
                    artist_data = resp.json()
                    profile = artist_data.get('profile', '')
                    country, year = extract_from_discogs_profile(profile)
                    
                    changed = False
                    if needs_country and country:
                        band['country'] = country
                        band['country_source'] = 'discogs'
                        stats['country_fixed_discogs'] += 1
                        changed = True
                    
                    if needs_formed and year:
                        band['formed'] = year
                        band['formed_source'] = 'discogs'
                        stats['formed_fixed_discogs'] += 1
                        changed = True
                    
                    if changed:
                        print(f"  ✅ {band_name} → Pays: {country}, Année: {year}", flush=True)
                elif resp.status_code == 429:
                    print(f"  ⏳ Rate limit Discogs pour {band_name}, attente 60s...", flush=True)
                    time.sleep(60)
            except requests.RequestException as e:
                print(f"  ⚠️ Erreur Discogs pour {band_name}: {e}", flush=True)
            
            if (stats['country_fixed_discogs'] + stats['formed_fixed_discogs']) % CACHE_SAVE_INTERVAL == 0:
                save_cache(COUNTRY_CACHE_FILE, country_cache)
                save_cache(FORMED_CACHE_FILE, formed_cache)

    save_cache(COUNTRY_CACHE_FILE, country_cache)
    save_cache(FORMED_CACHE_FILE, formed_cache)

    # ═══════════════════════════════════════════════════════
    # SAUVEGARDE ET RAPPORT FINAL
    # ═══════════════════════════════════════════════════════
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'bands': bands} if isinstance(data, dict) else bands, f, ensure_ascii=False, indent=2)

    print(f"\n" + "=" * 70, flush=True)
    print("🎉 TERMINÉ !", flush=True)
    print("=" * 70, flush=True)
    print(f"\n🌍 PAYS :", flush=True)
    print(f"   Via MusicBrainz (cache) : {stats['country_from_cache']:,}", flush=True)
    print(f"   Via MusicBrainz (API)   : {stats['country_fixed_mb']:,}", flush=True)
    print(f"   Via Discogs (fallback)  : {stats['country_fixed_discogs']:,}", flush=True)
    print(f"   Pas de donnée           : {stats['country_no_data']:,}", flush=True)
    
    print(f"\n📅 DATES DE FORMATION :", flush=True)
    print(f"   Via MusicBrainz (cache) : {stats['formed_from_cache']:,}", flush=True)
    print(f"   Via MusicBrainz (API)   : {stats['formed_fixed_mb']:,}", flush=True)
    print(f"   Via Discogs (fallback)  : {stats['formed_fixed_discogs']:,}", flush=True)
    print(f"   Artistes solos ignorés  : {stats['person_skipped']:,}", flush=True)
    print(f"   Pas de donnée           : {stats['formed_no_data']:,}", flush=True)
    
    print(f"\n💾 Fichier de sortie : {OUTPUT_FILE}", flush=True)
    print("=" * 70, flush=True)

if __name__ == '__main__':
    main()
