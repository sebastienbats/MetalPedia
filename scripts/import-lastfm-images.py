"""
═══════════════════════════════════════════════════════════
SCRIPT D'IMPORT DES IMAGES DANS METALPEDIA
Chaîne de résolution : Last.fm → Discogs → Wikipédia → Wikimedia Commons
═══════════════════════════════════════════════════════════

Usage :
    python scripts/import-lastfm-images.py
    python scripts/import-lastfm-images.py --dry-run --limit 10
    python scripts/import-lastfm-images.py --fix-placeholders --limit 100
    python scripts/import-lastfm-images.py --force
    python scripts/import-lastfm-images.py --no-fallback

Variables d'environnement requises (.env.local) :
    - NEXT_PUBLIC_SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY
    - LASTFM_API_KEY
    - DISCOGS_TOKEN (optionnel, recommandé)
"""

import os
import re
import sys
import time
import argparse
import requests
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════
CONFIG = {
    "delay_between_requests": 0.25,  # délai global (Last.fm)
    "discogs_delay": 1.0,            # Discogs : 60 req/min max → 1s entre appels
    "batch_size": 50,
    "timeout": 10,
    "default_limit": 0,
    "wikimedia_thumb_width": 640,    # 🆕 Taille demandée à l'API Wikimedia
                                     # (plafonnée automatiquement à la taille de l'original)
}

# User-Agents requis par les politiques des APIs
WIKIMEDIA_USER_AGENT = "MetalPedia/3.0 (https://metalpedia.vercel.app) python-requests"
DISCOGS_USER_AGENT = "MetalPedia/3.0 +https://metalpedia.vercel.app"

# ═══════════════════════════════════════════════════════════
# DÉTECTION DES PLACEHOLDERS LAST.FM
# ═══════════════════════════════════════════════════════════
LASTFM_PLACEHOLDER_SIGNATURES = [
    "2a96cbd8b46e442fc41c2b86b821562f",  # Étoile grise universelle
    "c6f59c1e5e7240a4c0d427abd71f3dbb",  # Ancien variant
    "noimage",
    "placeholder",
]

def is_placeholder_url(url: Optional[str]) -> bool:
    """Détecte les images placeholder (à rejeter)."""
    if not url:
        return True
    lowered = url.lower()
    return any(sig in lowered for sig in LASTFM_PLACEHOLDER_SIGNATURES)

def is_allowed_wikimedia_url(url: Optional[str]) -> bool:
    """N'accepte que les médias LIBRES (/wikipedia/commons/), cohérent avec la CSP."""
    if not url:
        return False
    return "/wikipedia/commons/" in url

# ═══════════════════════════════════════════════════════════
# COULEURS ANSI
# ═══════════════════════════════════════════════════════════
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    GRAY = "\033[90m"

def colored(text: str, color: str) -> str:
    return f"{color}{text}{Colors.RESET}"

def print_header(title: str) -> None:
    print()
    print(colored("╔═══════════════════════════════════════════════════════════╗", Colors.CYAN))
    print(colored(f"║   {title:<57} ║", Colors.CYAN + Colors.BOLD))
    print(colored("╚═══════════════════════════════════════════════════════════╝", Colors.CYAN))
    print()

# ═══════════════════════════════════════════════════════════
# PARSING DES ARGUMENTS CLI
# ═══════════════════════════════════════════════════════════
def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import des images (Last.fm → Discogs → Wikipédia → Commons)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
    python scripts/import-lastfm-images.py --dry-run --limit 10
    python scripts/import-lastfm-images.py --fix-placeholders --limit 100
    python scripts/import-lastfm-images.py --limit 1000
    python scripts/import-lastfm-images.py --force
    python scripts/import-lastfm-images.py --no-fallback
        """
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Mode test : aucune modification en base")
    parser.add_argument("--force", action="store_true",
                        help="Écrase TOUTES les images existantes")
    parser.add_argument("--fix-placeholders", action="store_true",
                        help="Corrige les groupes avec une image placeholder (étoile Last.fm)")
    parser.add_argument("--no-fallback", action="store_true",
                        help="Désactive Discogs/Wikipédia/Commons")
    parser.add_argument("--limit", type=int, default=CONFIG["default_limit"],
                        help="Nombre maximum de groupes à traiter (0 = tous)")
    parser.add_argument("--batch-size", type=int, default=CONFIG["batch_size"],
                        help="Taille des lots de traitement")
    parser.add_argument("--delay", type=float, default=CONFIG["delay_between_requests"],
                        help="Délai global entre requêtes (secondes)")
    return parser.parse_args()

# ═══════════════════════════════════════════════════════════
# CHARGEMENT DES VARIABLES D'ENVIRONNEMENT
# ═══════════════════════════════════════════════════════════
def load_environment() -> Dict[str, str]:
    env_paths = [".env.local", ".env", "env.local"]
    for path in env_paths:
        if os.path.exists(path):
            load_dotenv(path)
            print(colored(f"✓ Variables chargées depuis {path}", Colors.GRAY))
            break
    else:
        print(colored("⚠ Aucun fichier .env trouvé, utilisation des variables système", Colors.YELLOW))

    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    lastfm_key = os.getenv("LASTFM_API_KEY")
    discogs_token = os.getenv("DISCOGS_TOKEN")  # Optionnel

    errors = []
    if not supabase_url:
        errors.append("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL")
    if not supabase_key:
        errors.append("SUPABASE_SERVICE_ROLE_KEY")
    if not lastfm_key:
        errors.append("LASTFM_API_KEY (→ https://www.last.fm/api/account/create)")

    if errors:
        print(colored("\n❌ Erreur : Variables d'environnement manquantes :", Colors.RED + Colors.BOLD))
        for err in errors:
            print(colored(f"   - {err}", Colors.RED))
        print()
        sys.exit(1)

    if not discogs_token:
        print(colored("⚠ DISCOGS_TOKEN absent : fallback Discogs désactivé", Colors.YELLOW))
    else:
        print(colored("✓ Discogs activé (fallback #2)", Colors.GREEN))

    return {
        "supabase_url": supabase_url,
        "supabase_key": supabase_key,
        "lastfm_key": lastfm_key,
        "discogs_token": discogs_token or "",
    }

# ═══════════════════════════════════════════════════════════
# SOURCE 1 : LAST.FM (avec filtrage anti-placeholder)
# ═══════════════════════════════════════════════════════════
def fetch_image_from_lastfm(artist_name: str, api_key: str) -> Optional[str]:
    """Récupère l'image depuis Last.fm, en rejetant les placeholders."""
    try:
        params = {
            "method": "artist.getInfo",
            "artist": artist_name,
            "api_key": api_key,
            "format": "json",
        }
        response = requests.get(
            "https://ws.audioscrobbler.com/2.0/",
            params=params,
            timeout=CONFIG["timeout"],
        )
        if response.status_code != 200:
            return None

        data = response.json()
        if "error" in data or "artist" not in data:
            return None

        images = data.get("artist", {}).get("image", [])
        if not images:
            return None

        preferred_sizes = ["extralarge", "large", "medium", "small"]
        for size in preferred_sizes:
            for img in images:
                if img.get("size") == size:
                    img_url = (img.get("#text") or "").strip()
                    if img_url and not is_placeholder_url(img_url):
                        return img_url

        # Fallback : première image non placeholder
        for img in images:
            img_url = (img.get("#text") or "").strip()
            if img_url and not is_placeholder_url(img_url):
                return img_url

        return None  # Toutes les images étaient des placeholders

    except requests.exceptions.Timeout:
        print(colored(f"\n   ⏱️  Timeout Last.fm pour \"{artist_name}\"", Colors.YELLOW))
        return None
    except requests.exceptions.RequestException as e:
        print(colored(f"\n   ⚠️  Erreur réseau Last.fm pour \"{artist_name}\": {e}", Colors.YELLOW))
        return None
    except Exception as e:
        print(colored(f"\n   ⚠️  Erreur Last.fm pour \"{artist_name}\": {e}", Colors.YELLOW))
        return None

# ═══════════════════════════════════════════════════════════
# SOURCE 2 : DISCOGS (photos d'artistes, couverture underground)
# ═══════════════════════════════════════════════════════════
def fetch_image_from_discogs(artist_name: str, token: str) -> Optional[str]:
    """
    Recherche l'artiste puis récupère ses images via /artists/{id}.
    ⚠️ Rate limit : 60 req/min → sleep de 1s entre les 2 appels.
    """
    if not token:
        return None

    headers = {
        "User-Agent": DISCOGS_USER_AGENT,
        "Authorization": f"Discogs token={token}",
    }

    try:
        # 1. Recherche de l'artiste
        search_resp = requests.get(
            "https://api.discogs.com/database/search",
            params={"q": artist_name, "type": "artist", "per_page": 1},
            headers=headers,
            timeout=CONFIG["timeout"],
        )

        # Logs d'erreur d'auth et rate limit
        if search_resp.status_code == 401:
            print(colored(f"\n   🔑 Token Discogs invalide", Colors.RED))
            return None
        if search_resp.status_code == 429:
            print(colored(f"\n   ⏱️  Rate limit Discogs atteint", Colors.YELLOW))
            time.sleep(60)
            return None
        if search_resp.status_code != 200:
            return None

        results = search_resp.json().get("results") or []
        if not results:
            return None

        artist_id = results[0].get("id")
        if not artist_id:
            return None

        # ⚠️ Respect du rate limit Discogs (60 req/min)
        time.sleep(CONFIG["discogs_delay"])

        # 2. Détails de l'artiste (champ "images" = vraies photos)
        artist_resp = requests.get(
            f"https://api.discogs.com/artists/{artist_id}",
            headers=headers,
            timeout=CONFIG["timeout"],
        )
        if artist_resp.status_code != 200:
            return None

        images = artist_resp.json().get("images") or []
        if not images:
            return None

        # Priorité : image "primary", sinon la première
        primary = next((i for i in images if i.get("type") == "primary"), None)
        chosen = primary or images[0]
        img_url = chosen.get("uri") or chosen.get("resource_url")

        if not img_url or is_placeholder_url(img_url):
            return None

        # ✅ Accepter TOUS les domaines Discogs (img.discogs.com ET i.discogs.com)
        if "discogs.com" in img_url:
            return img_url

        return None

    except requests.exceptions.RequestException:
        return None
    except Exception:
        return None

# ═══════════════════════════════════════════════════════════
# SOURCE 3 : WIKIPÉDIA (via action=query + pithumbsize)
# ═══════════════════════════════════════════════════════════
def fetch_image_from_wikipedia(artist_name: str) -> Optional[str]:
    """
    Récupère l'image de l'infobox Wikipédia via l'API action=query.
    ✅ pithumbsize : l'API plafonne automatiquement à la largeur de
       l'image originale → aucune URL 404 possible.
    """
    try:
        params = {
            "action": "query",
            "format": "json",
            "redirects": 1,
            "titles": artist_name,
            "prop": "pageimages",
            "piprop": "thumbnail",
            "pithumbsize": CONFIG["wikimedia_thumb_width"],
        }
        response = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params=params,
            headers={"User-Agent": WIKIMEDIA_USER_AGENT},
            timeout=CONFIG["timeout"],
        )
        if response.status_code != 200:
            return None

        data = response.json()
        pages = (data.get("query") or {}).get("pages") or {}

        for page in pages.values():
            thumb = (page.get("thumbnail") or {}).get("source")
            if thumb and not is_placeholder_url(thumb) and is_allowed_wikimedia_url(thumb):
                return thumb  # ✅ URL garantie valide par l'API (plafonnée à la taille originale)

        return None

    except requests.exceptions.RequestException:
        return None
    except Exception:
        return None

# ═══════════════════════════════════════════════════════════
# SOURCE 4 : WIKIMEDIA COMMONS (recherche)
# ═══════════════════════════════════════════════════════════
def fetch_image_from_commons(artist_name: str) -> Optional[str]:
    """
    Dernière chance : recherche directe sur Wikimedia Commons.
    ✅ iiurlwidth plafonné à la taille de l'image originale par l'API.
    """
    try:
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f'filetype:bitmap "{artist_name}" band',
            "gsrnamespace": 6,
            "gsrlimit": 3,
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": CONFIG["wikimedia_thumb_width"],  # 🆕 Utilise la config
        }
        response = requests.get(
            "https://commons.wikimedia.org/w/api.php",
            params=params,
            headers={"User-Agent": WIKIMEDIA_USER_AGENT},
            timeout=CONFIG["timeout"],
        )
        if response.status_code != 200:
            return None

        data = response.json()
        pages = (data.get("query") or {}).get("pages") or {}

        for page in sorted(pages.values(), key=lambda p: p.get("index", 99)):
            info_list = page.get("imageinfo") or []
            if not info_list:
                continue
            info = info_list[0]

            if info.get("mime") not in ("image/jpeg", "image/png"):
                continue

            img_url = info.get("thumburl") or info.get("url")
            if img_url and not is_placeholder_url(img_url) and is_allowed_wikimedia_url(img_url):
                return img_url  # ✅ URL garantie valide par l'API

        return None

    except requests.exceptions.RequestException:
        return None
    except Exception:
        return None

# ═══════════════════════════════════════════════════════════
# CHAÎNE DE RÉSOLUTION COMPLÈTE
# ═══════════════════════════════════════════════════════════
def resolve_image(
    band_name: str,
    lastfm_key: str,
    discogs_token: str,
    use_fallback: bool,
    stats: Dict[str, int],
) -> Optional[str]:
    """
    Essaie les sources dans l'ordre :
    1. Last.fm (filtré anti-placeholder)
    2. Discogs (si token fourni)
    3. Wikipédia (infobox via action=query)
    4. Wikimedia Commons (recherche)
    """
    # 1. Last.fm
    image_url = fetch_image_from_lastfm(band_name, lastfm_key)
    if image_url:
        stats["from_lastfm"] += 1
        return image_url

    stats["lastfm_no_valid"] += 1

    if not use_fallback:
        return None

    # 2. Discogs
    image_url = fetch_image_from_discogs(band_name, discogs_token)
    if image_url:
        stats["from_discogs"] += 1
        return image_url

    # 3. Wikipédia
    image_url = fetch_image_from_wikipedia(band_name)
    if image_url:
        stats["from_wikipedia"] += 1
        return image_url

    # 4. Wikimedia Commons
    image_url = fetch_image_from_commons(band_name)
    if image_url:
        stats["from_commons"] += 1
        return image_url

    return None

# ═══════════════════════════════════════════════════════════
# FONCTIONS SUPABASE
# ═══════════════════════════════════════════════════════════
def get_bands_to_process(
    supabase: Client,
    force: bool,
    limit: int,
    fix_placeholders: bool = False,
) -> List[Dict[str, Any]]:
    """Récupère les groupes à traiter depuis Supabase selon le mode."""
    query = supabase.table("bands").select("id, name, genre, image_url")
    query = query.order("listeners", desc=True)

    if fix_placeholders:
        # 🆕 Mode correction : cible DIRECTEMENT les URLs placeholder via ILIKE
        # (évite .not_()/.neq() qui posent problème selon les versions de supabase-py)
        # Génère : image_url.ilike.*2a96cbd8...*,image_url.ilike.*noimage*,...
        placeholder_filters = ",".join(
            f"image_url.ilike.*{sig}*" for sig in LASTFM_PLACEHOLDER_SIGNATURES
        )
        query = query.or_(placeholder_filters)
    elif not force:
        # Mode normal : seulement les groupes SANS image
        query = query.or_("image_url.is.null,image_url.eq.")
    # Si force=True, on prend tout (pas de filtre)

    if limit > 0:
        query = query.limit(limit)

    response = query.execute()
    return response.data or []

def update_band_image(supabase: Client, band_id: int, image_url: str, dry_run: bool) -> bool:
    """Met à jour l'image d'un groupe dans Supabase."""
    if dry_run:
        return True

    try:
        supabase.table("bands").update({
            "image_url": image_url
        }).eq("id", band_id).execute()
        return True
    except Exception as e:
        print(colored(f"\n   ❌ Erreur DB pour ID {band_id}: {e}", Colors.RED))
        return False

# ═══════════════════════════════════════════════════════════
# FONCTION PRINCIPALE
# ═══════════════════════════════════════════════════════════
def main():
    args = parse_arguments()

    print_header("🎸 IMPORT DES IMAGES DANS METALPEDIA")

    if args.dry_run:
        print(colored("🧪 MODE DRY-RUN : Aucune modification en base", Colors.MAGENTA + Colors.BOLD))
    if args.force:
        print(colored("⚡ MODE FORCE : Écrasement de TOUTES les images existantes", Colors.YELLOW + Colors.BOLD))
    if args.fix_placeholders:
        print(colored("🔄 MODE FIX-PLACEHOLDERS : correction des étoiles Last.fm", Colors.YELLOW + Colors.BOLD))
    if args.no_fallback:
        print(colored("🚫 Fallbacks désactivés (Last.fm uniquement)", Colors.GRAY))
    print(f"📐 Taille Wikipedia/Commons : {CONFIG['wikimedia_thumb_width']}px (plafonnée par l'API)")
    print()

    # Vérification des modes mutuellement exclusifs
    if args.force and args.fix_placeholders:
        print(colored("❌ Erreur : --force et --fix-placeholders sont incompatibles", Colors.RED))
        sys.exit(1)

    env = load_environment()

    try:
        supabase: Client = create_client(env["supabase_url"], env["supabase_key"])
    except Exception as e:
        print(colored(f"❌ Erreur de connexion Supabase : {e}", Colors.RED))
        sys.exit(1)

    # ─────────────────────────────────────────────────────
    # 1. RÉCUPÉRER LES GROUPES À TRAITER
    # ─────────────────────────────────────────────────────
    print(colored("📊 Récupération des groupes depuis Supabase...", Colors.BLUE + Colors.BOLD))

    try:
        bands = get_bands_to_process(
            supabase,
            args.force,
            args.limit,
            args.fix_placeholders,
        )
    except Exception as e:
        print(colored(f"❌ Erreur Supabase : {e}", Colors.RED))
        sys.exit(1)

    if not bands:
        print(colored("✅ Aucun groupe à traiter !", Colors.GREEN))
        return

    print(f"   → {colored(str(len(bands)), Colors.BOLD)} groupes à traiter")
    print()

    # ─────────────────────────────────────────────────────
    # 2. TRAITEMENT PAR LOTS
    # ─────────────────────────────────────────────────────
    stats = {
        "total": len(bands),
        "processed": 0,
        "updated": 0,
        "not_found": 0,
        "errors": 0,
        "skipped": 0,
        "lastfm_no_valid": 0,
        "from_lastfm": 0,
        "from_discogs": 0,
        "from_wikipedia": 0,
        "from_commons": 0,
    }

    start_time = time.time()
    total_batches = (len(bands) + args.batch_size - 1) // args.batch_size

    for batch_num, i in enumerate(range(0, len(bands), args.batch_size), 1):
        batch = bands[i:i + args.batch_size]

        print(colored(f"━━━ Lot {batch_num}/{total_batches} ({len(batch)} groupes) ━━━", Colors.CYAN))

        for band in batch:
            stats["processed"] += 1
            progress = (stats["processed"] / stats["total"]) * 100
            band_name = band["name"][:30].ljust(30)

            sys.stdout.write(
                f"\r[{stats['processed']}/{stats['total']}] "
                f"({progress:.1f}%) {band_name} "
            )
            sys.stdout.flush()

            # ── Gestion du skip selon le mode ──────────────────
            if args.fix_placeholders:
                current_url = band.get("image_url")
                if not is_placeholder_url(current_url):
                    # Ce n'est pas un placeholder, on skip
                    print(colored("✅ OK", Colors.GREEN))
                    stats["skipped"] += 1
                    continue
                # C'est un placeholder, on va le remplacer
                print(colored("🔄 ", Colors.YELLOW), end="", flush=True)
            elif not args.force and band.get("image_url"):
                print(colored("⏭️  skip", Colors.GRAY))
                stats["skipped"] += 1
                continue

            # ── Résolution de l'image ──────────────────────────
            image_url = resolve_image(
                band["name"],
                env["lastfm_key"],
                env["discogs_token"],
                use_fallback=not args.no_fallback,
                stats=stats,
            )

            if image_url:
                success = update_band_image(supabase, band["id"], image_url, args.dry_run)
                if success:
                    print(colored(f"✅ {image_url[:55]}...", Colors.GREEN))
                    stats["updated"] += 1
                else:
                    stats["errors"] += 1
            else:
                print(colored("❌ non trouvé", Colors.RED))
                stats["not_found"] += 1

            time.sleep(args.delay)

        print()

    # ─────────────────────────────────────────────────────
    # 3. RÉSUMÉ FINAL
    # ─────────────────────────────────────────────────────
    duration = time.time() - start_time

    # Variables intermédiaires (évite les f-strings imbriquées boguées)
    processed = stats["processed"]
    total = stats["total"]
    updated = stats["updated"]
    not_found = stats["not_found"]
    skipped = stats["skipped"]
    errors = stats["errors"]
    lastfm_no_valid = stats["lastfm_no_valid"]
    from_lastfm = stats["from_lastfm"]
    from_discogs = stats["from_discogs"]
    from_wiki = stats["from_wikipedia"]
    from_commons = stats["from_commons"]

    print()
    print_header("📊 RÉSUMÉ FINAL")

    print(f"  ⏱️  Durée totale             : {colored(f'{duration:.1f}s', Colors.BOLD)}")
    print(f"  📦 Groupes traités           : {colored(f'{processed}/{total}', Colors.BOLD)}")
    print(f"  ✅ Images ajoutées           : {colored(str(updated), Colors.GREEN)}")
    print(f"     ├─ 🎵 Last.fm            : {colored(str(from_lastfm), Colors.GREEN)}")
    print(f"     ├─ 💿 Discogs            : {colored(str(from_discogs), Colors.BLUE)}")
    print(f"     ├─ 📖 Wikipédia          : {colored(str(from_wiki), Colors.CYAN)}")
    print(f"     └─ 🌍 Commons            : {colored(str(from_commons), Colors.MAGENTA)}")
    print(f"  🚫 Last.fm sans image valide : {colored(str(lastfm_no_valid), Colors.YELLOW)}")
    print(f"  ❌ Non trouvés               : {colored(str(not_found), Colors.RED)}")
    print(f"  ⏭️  Ignorés                  : {colored(str(skipped), Colors.GRAY)}")
    print(f"  ⚠️  Erreurs                  : {colored(str(errors), Colors.YELLOW)}")

    if args.fix_placeholders:
        placeholders_fixed = updated
        print(f"  🔄 Placeholders corrigés     : {colored(str(placeholders_fixed), Colors.YELLOW + Colors.BOLD)}")
    print()

    if args.dry_run:
        print(colored("🧪 Mode dry-run : rien n'a été écrit en base.", Colors.MAGENTA))
        print(colored("   Relance sans --dry-run pour appliquer les changements.", Colors.GRAY))
    elif updated > 0:
        print(colored(f"🎉 {updated} groupes ont maintenant une vraie image !", Colors.GREEN + Colors.BOLD))
    print()

# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(colored("\n\n⏹️  Script interrompu par l'utilisateur.", Colors.YELLOW + Colors.BOLD))
        sys.exit(0)
    except Exception as e:
        print(colored(f"\n❌ Erreur fatale : {e}", Colors.RED + Colors.BOLD))
        import traceback
        traceback.print_exc()
        sys.exit(1)