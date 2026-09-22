<div align="center">

# 🤘 MetalPedia

### L'encyclopédie interactive du Metal avec gamification épique

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?style=flat&logo=vercel)](https://metalpedia.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Explorez les groupes de metal, gagnez de l'XP, collectionnez des reliques et devenez le DIEU DU METALVERSE.**

[Demo](https://metalpedia.vercel.app) • [Documentation](#-fonctionnalités-implémentées) • [Contribuer](#-contribuer)

</div>

---

## 📖 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités Implémentées](#-fonctionnalités-implémentées)
- [Système de Gamification](#-système-de-gamification)
- [Stack Technique](#-stack-technique)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Pipeline de Données Python](#-pipeline-de-données-python)
- [Structure du Projet](#-structure-du-projet)
- [API](#-api)
- [Roadmap](#-roadmap)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## 🎯 Aperçu

**MetalPedia** est bien plus qu'une simple base de données. C'est une **encyclopédie vivante** qui transforme l'exploration musicale en une aventure RPG. 

Grâce à une base de données Supabase robuste et une architecture moderne, MetalPedia offre une expérience fluide, fonctionnant même hors ligne, avec des visualisations de données avancées et un système de progression profondément immersif.

### 🌟 Points forts

- **10 000+ groupes** de metal catalogués avec données enrichies
- **Gamification complète** : 8 rangs, 14 badges Timeline, quêtes épiques
- **Recommandations intelligentes** : Graphe de similarité avec résolution d'IDs Supabase
- **Analyse audio** : Empreinte sonore via AcousticBrainz + Last.fm
- **PWA complète** : Fonctionne hors ligne, installable sur mobile
- **Optimisé** : Images AVIF/WebP, cache ISR, lazy loading

---

## ✨ Fonctionnalités Implémentées

### 🎸 Encyclopédie & Navigation Hiérarchique
- ✅ **Double système de genres** : Genre original (Last.fm) + **9 Piliers de Gamification** (Black, Death, Heavy, Thrash, Power, Doom, Progressive, Folk, Metalcore).
- ✅ **Navigation par Piliers** : Pages dédiées `/genres` avec grille interactive et filtres dynamiques par sous-genre.
- ✅ **Fiches de groupes enrichies** : Biographies multi-langues, pays vérifiés (MusicBrainz), année de formation, statut, et compteur d'auditeurs.
- ✅ **Discographie complète** : Albums avec pochettes optimisées (AVIF/WebP), types (Album, EP, Single, etc.).
- ✅ **Membres du groupe** : Liste avec rôles, périodes d'activité, badge "Actuel" pour les membres courants.
- ✅ **Recherche intelligente** : Autocomplétion avec debounce et Command Palette (`Ctrl+K`).

### 🎮 Système de Gamification (RPG)
- ✅ **Moteur d'XP local-first** : Calcul en temps réel via Zustand + persistance IndexedDB (`idb-keyval`), fonctionnant même hors ligne.
- ✅ **8 Rangs épiques** : De "Novice du Silence" à "DIEU DU METALVERSE" 👑.
- ✅ **9 Classes de personnages** : Nécromancien (Black), Exécuteur (Death), Paladin (Heavy), Berserker (Thrash), Barde (Power), Gardien du Néant (Doom), Architecte du Chaos (Prog), Chaman (Folk), Briseur de Chaînes (Metalcore).
- ✅ **Système de Succès Timeline** : 14 badges à débloquer (5 de progression + 9 de maîtrise de pilier).
- ✅ **Badges & Quêtes** : Déblocage conditionnel basé sur les actions (vues, favoris, exploration de genres).
- ✅ **Lore immersif** : Chaque action est narrativisée (ex: "Rune déchiffrée", "Sortilège lancé").
- ✅ **Migration rétroactive** : Les badges sont automatiquement débloqués pour les fragments déjà collectés.

### 🎵 Analyse Audio & Recommandations
- ✅ **AudioRadar** : Empreinte sonore avec 7 métriques (danse, énergie, humeur, acoustique, instrumental, live, tempo).
  - 🧬 **Source primaire** : AcousticBrainz (vraies analyses audio via MusicBrainz ID)
  - 🎯 **Fallback intelligent** : Last.fm tags + heuristiques de genre si MBID absent
  - 🔀 **Mode hybride** : Fusion des deux sources avec indicateur de couverture
- ✅ **SimilarityGraph** : Graphe D3.js force-directed des groupes similaires.
  - 🎯 **Résolution batch** : Recherche des IDs Supabase réels (1 requête SQL optimisée)
  - 📚 **Indicateur de couverture** : "X/Y groupes catalogués (Z%)"
  - 🔗 **Liens intelligents** : Nœuds rouges = cliquables, gris = non catalogués
  - 💾 **Cache ISR** : 1 heure pour minimiser les appels API

### 🌍 Visualisations & Data
- ✅ **Metal Map 3D** : Globe interactif (`react-globe.gl`) montrant la densité réelle des groupes par pays, connecté en temps réel à Supabase.
- ✅ **Timeline historique** : Chronologie interactive de l'histoire du metal avec 85 fragments à collectionner.
- ✅ **Stats Panel** : Visualisation Recharts des statistiques de progression.

### 📱 Expérience Utilisateur & PWA
- ✅ **Images optimisées** : `next/image` avec formats AVIF/WebP, lazy loading, fallback gracieux.
- ✅ **Favoris Local-First** : Système de favoris robuste avec compteur dynamique dans le Header, résistant au rechargement et fonctionnant hors ligne.
- ✅ **PWA Complète** : Installable, page de fallback offline, et service worker configuré via `next-pwa`.
- ✅ **Thèmes dynamiques** : Système de thèmes avec persistance et script anti-flash.
- ✅ **Layout optimisé** : Flexbox strict garantissant que le Footer ne chevauche jamais les widgets flottants (comme la XPBar).
- ✅ **Widget Concerts** : Intégration des événements à venir sur les fiches des groupes.
- ✅ **Sécurité renforcée** : CSP stricte, headers de sécurité, validation des entrées.

---

## 🎮 Système de Gamification

### 📜 Le Lore : La Légende du Metalverse

> *« Au commencement, il n'y avait que le silence. Puis vint le Premier Riff, et le Metalverse naquit dans un déluge de distorsion. Les Anciens forgèrent les Tables du Savoir, recensant chaque horde, chaque clan, chaque incantation sonore. Mais les Tables se corrompirent, et le Savoir se dispersa dans les ténèbres.*
>
> *Toi, Métalleux errant, tu as été choisi par le Conseil des Neuf Genres pour restaurer le Savoir. Chaque groupe consulté est une rune déchiffrée. Chaque favori ajouté est un fragment de la Table reconstitué. Chaque review écrite est un sortilège lancé contre l'Oubli.*
>
> *Gravis les échelons de la Hiérarchie du Riff. Collectionne les Reliques des Anciens. Accomplis les Quêtes Épiques. Et un jour, peut-être, atteindras-tu le rang ultime : **DIEU DU METALVERSE**. »*

### 🏆 Hiérarchie des Rangs

| Niveau | Titre | XP requis | Icône |
|--------|-------|-----------|-------|
| 1 | Novice du Silence | 0 | 👤 |
| 5 | Écuyer du Riff | 500 | 🎸 |
| 10 | Chevalier de la Distorsion | 2 000 | ⚔️ |
| 20 | Seigneur du Blast Beat | 8 000 | 💀 |
| 35 | Archimage du Thrash | 25 000 | 🔥 |
| 50 | Gardien des Neuf Tables | 60 000 | 📜 |
| 75 | Pourfendeur de l'Oubli | 150 000 | ⚡ |
| 100 | **DIEU DU METALVERSE** | 500 000 | 👑 |

### 💰 Sources d'XP

| Action | XP gagné |
|--------|----------|
| Consulter un groupe | +10 |
| Ajouter un favori | +25 |
| Explorer un nouveau genre | +30 |
| Écrire une review | +100 |
| Compléter une quête | +50 à +1200 |
| Bonus quotidien | +50 |

### 🏅 Système de Badges Timeline

#### 📈 Badges de Progression (5)

| Badge | Condition | Rareté |
|-------|-----------|--------|
| 🌱 Premier Pas | 1 fragment collecté | Commun |
| 📜 Chroniqueur | 10 fragments collectés | Rare |
| 🗺️ Explorateur du Metalverse | 25 fragments collectés | Épique |
| 🏛️ Archiviste des Âges | 50 fragments collectés | Épique |
| 👑 Grand Sage du Metalverse | 85 fragments (toutes Tables complètes) | Légendaire |

#### 🏛️ Badges de Maîtrise (9)

| Pilier | Badge | Condition |
|--------|-------|-----------|
| 🎸 Heavy Metal | Érudit du Heavy Metal | Table Heavy Metal complète (7/7) |
| ⚡ Thrash Metal | Maître du Thrash | Table Thrash complète (11/11) |
| 🩸 Death Metal | Seigneur du Death | Table Death complète (11/11) |
| 💀 Black Metal | Hérétique du Black | Table Black complète (10/10) |
| 🔥 Power Metal | Barde du Power | Table Power complète (9/9) |
| 🧟 Doom Metal | Gardien du Doom | Table Doom complète (7/7) |
| 🌀 Progressive Metal | Architecte du Progressif | Table Prog complète (8/8) |
| 🍀 Folk Metal | Chaman du Folk | Table Folk complète (7/7) |
| 💥 Metalcore | Briseur du Metalcore | Table Metalcore complète (10/10) |

### ⚔️ Classes de Personnages

| Classe | Pilier | Bonus | Icône |
|--------|--------|-------|-------|
| Nécromancien | Black Metal | +50% XP sur groupes obscurs | 💀 |
| Exécuteur | Death Metal | +50% XP sur reviews | 🩸 |
| Paladin | Heavy Metal | +50% XP global | 🎸 |
| Berserker | Thrash Metal | +50% XP sur groupes actifs | ⚡ |
| Barde | Power Metal | +50% XP sur favoris | 🔥 |
| Gardien du Néant | Doom Metal | +50% XP sur groupes anciens | 🧟 |
| Architecte du Chaos | Progressive Metal | +50% XP sur biographies | 🌀 |
| Chaman | Folk Metal | +50% XP sur pays rares | 🍀 |
| Briseur de Chaînes | Metalcore | +50% XP sur quiz | 💥 |

### 📜 Quêtes Épiques

| Difficulté | Nombre | Exemples |
|------------|--------|----------|
| 🟢 Novice | 2 | Premiers Pas, Première Étoile |
| 🔵 Apprentice | 4 | Initiation au Black Metal, Épreuve du Thrash |
| 🟣 Master | 3 | Chercheur de Savoir, Premier Sortilège |
| 🟠 Legendary | 3 | Restaureur des Tables, Légion du Metal |

---

## 🛠 Stack Technique

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS |
| **State & Cache** | Zustand, TanStack Query, IndexedDB (`idb-keyval`), React Query cache |
| **Backend / DB** | Supabase (PostgreSQL, Auth, RLS, Edge Functions), Python 3.12 (Scripts d'ingestion) |
| **Visualisation** | `react-globe.gl`, D3.js, Recharts, `vis-timeline` |
| **APIs Externes** | Last.fm (tags, similarité), MusicBrainz (métadonnées), AcousticBrainz (analyse audio) |
| **Images** | `next/image` (AVIF/WebP), Fastly CDN (Last.fm), Wikimedia Commons |
| **DevOps** | Vercel, Docker, GitHub Actions (CI/CD), ESLint, Prettier, Husky |
| **Sécurité** | CSP stricte, headers de sécurité, validation des entrées, RLS Supabase |

---

## 🏗 Architecture

### Vue d'ensemble
┌───────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Next.js App  │ │      Zustand │ │    IndexedDB │        │
│ │       Router │ │ Stores       | │   (offline)  │        │
│ └──────┬───────┘ └──────────────┘ └──────────────┘        │
└────────┼──────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ NEXT.JS API ROUTES                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │ /api/bands   │   │/api/audio-   │   │ /api/similar │    │
│  │              │   │ features     │   │              │    │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Supabase     │ │ AcousticBrainz   │ │ Last.fm API      │
│ (PostgreSQL) │ │ + MusicBrainz     │ │ (tags, similar) │
└──────────────┘ └──────────────────┘ └──────────────────┘

### Flux de données

1. **Recherche/Consultation** : Supabase Database (Données maîtrisées)
2. **Recommandations ML** : Next.js → ML Service → Spotify API → Embeddings
3. **Authentification** : Next.js → Supabase Auth → JWT
4. **Reviews/Favoris** : Next.js → Supabase Database (RLS)
5. **Offline** : IndexedDB → Sync automatique au retour en ligne

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** ≥ 20.0.0 ([télécharger](https://nodejs.org))
- **npm** ≥ 10.0.0 ou **pnpm** ≥ 8
- **Python** ≥ 3.11 (pour le ML Service)
- **Docker** & **Docker Compose** (optionnel, pour l'orchestration)
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Spotify Developer](https://developer.spotify.com) (gratuit)
- Une clé [OpenAI API](https://platform.openai.com) (optionnel)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/sebastienbats/MetalPedia.git
cd MetalPedia
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` et remplissez les valeurs (voir section [Variables d'environnement](#-variables-denvironnement)).

### 4. Configurer Supabase

1. Créez un projet sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Exécutez le script SQL de migration (`supabase/migrations/001_init.sql`)
3. Activez les providers d'authentification (Email, GitHub, Google)
4. Récupérez l'URL et la clé anon

### 5. Générer les icônes PWA

```bash
npm run icons
```

### 6. Lancer le frontend

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

### 7. Lancer le ML Service (optionnel)

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Remplir SPOTIFY_CLIENT_ID et SECRET
uvicorn app.main:app --reload --port 8000
```

Le ML Service sera disponible sur [http://localhost:8000](http://localhost:8000).

### Alternative : Docker Compose

```bash
# Démarrer tous les services (frontend + ML + Redis)
npm run docker:up

# Voir les logs
npm run docker:logs

# Arrêter
npm run docker:down
```

---

## 🔐 Variables d'environnement

Créez un fichier `.env.local` à la racine :

```env
# ═══════════════════════════════════════════
# FRONTEND
# ═══════════════════════════════════════════
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000

# ═══════════════════════════════════════════
# SUPABASE (Server only)
# ═══════════════════════════════════════════
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# ═══════════════════════════════════════════
# ML SERVICE
# ═══════════════════════════════════════════
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=sk-xxxx

# ═══════════════════════════════════════════
# OPTIONNEL
# ═══════════════════════════════════════════
SONGKICK_API_KEY=your_songkick_key
NEXT_PUBLIC_SENTRY_DSN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> ⚠️ **Important** : Ne commitez jamais `.env.local` dans Git. Il est déjà inclus dans `.gitignore`.

---

## 💻 Utilisation

### Navigation principale

| URL | Description |
|-----|-------------|
| `/` | Accueil avec filtres par genre |
| `/band/:id` | Fiche détaillée d'un groupe |
| `/search/:query` | Résultats de recherche |
| `/favorites` | Vos favoris |
| `/profile` | Votre profil gamifié (XP, badges, quêtes) |
| `/graph/:bandId` | Graphe de similarité ML |
| `/audio/:bandId` | Analyse audio Spotify |
| `/map` | Metal Map 3D |
| `/timeline` | Timeline historique |
| `/ai` | Générateur de logos IA |

### Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + K` | Ouvrir la Command Palette |
| `Esc` | Fermer les modals |

### Gamification

1. **Consultez des groupes** pour gagner de l'XP (+10/groupe)
2. **Ajoutez des favoris** (+25 XP)
3. **Écrivez des reviews** (+100 XP)
4. **Complétez des quêtes** pour des bonus massifs
5. **Connectez-vous quotidiennement** pour la bénédiction des Anciens (+50 XP)

---

## 📜 Scripts disponibles

### Développement

```bash
npm run dev              # Lancer en dev (http://localhost:3000)
npm run build            # Build de production
npm run start            # Lancer le build de production
npm run clean            # Nettoyer les caches
```

### Qualité de code

```bash
npm run lint             # Vérifier ESLint
npm run lint:fix         # Corriger automatiquement
npm run type-check       # Vérifier TypeScript
npm run format           # Formater avec Prettier
npm run analyze          # Analyser le bundle
```

### Assets

```bash
npm run icons            # Générer les icônes PWA
```

### ML Service

```bash
npm run ml:dev           # Lancer FastAPI en dev
npm run ml:build         # Build Docker du ML service
```

### Dataset

```bash
npm run export:data      # Exporter CSV + Parquet
npm run export:hf        # Uploader sur HuggingFace
```

### Docker

```bash
npm run docker:up        # Démarrer tous les services
npm run docker:down      # Arrêter les services
npm run docker:logs      # Voir les logs
npm run docker:clean     # Arrêter + supprimer les volumes
```

### Tests

```bash
npm run test             # Tests unitaires (Jest)
npm run test:e2e         # Tests E2E (Playwright)
npm run test:coverage    # Couverture de tests
```

---

## 📁 Structure du projet

```
metal-pedia/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline CI/CD
├── public/
│   ├── icon.svg                  # Icône source
│   ├── icons/                    # Icônes PWA générées
│   ├── manifest.json             # Manifest PWA
│   └── offline.html              # Page offline
├── scripts/
│   ├── generate-icons.mjs        # Génération icônes
│   ├── export_dataset.py         # Export dataset
│   ├── upload_huggingface.py     # Upload HuggingFace
│   ├── fetch_metal_bands.py      # 🐍 Fetch depuis Last.fm + Discogs
│   ├── import_to_supabase.py     # 🐍 Pipeline Python (import)
│   └── import-lastfm-images.py   # 🐍 Import images Last.fm
├── src/
│   ├── app/                      # App Router Next.js
│   │   ├── genres/              # 🆕 Navigation par 9 piliers + filtres
│   │   ├── layout.tsx           # Layout racine
│   │   ├── page.tsx             # Accueil
│   │   ├── band/[id]/           # Fiche groupe (bio, albums, membres, audio, similaires)
│   │   ├── search/[query]/      # Recherche
│   │   ├── favorites/           # Favoris
│   │   ├── profile/             # Profil gamifié
│   │   ├── graph/[bandId]/      # Graphe similarité
│   │   ├── audio/[bandId]/      # Analyse audio
│   │   ├── map/                 # Metal Map 3D
│   │   ├── timeline/            # Timeline
│   │   ├── ai/                  # Studio IA
│   │   ├── opengraph-image.tsx  # OG image dynamique
│   │   └── api/                 # Route Handlers
│   │       ├── bands/[id]/      # Détails groupe
│   │       ├── audio-features/[bandId]/  # 🆕 Empreinte audio (AcousticBrainz + Last.fm)
│   │       ├── similar/[bandId]/         # 🆕 Groupes similaires (Last.fm + résolution Supabase)
│   │       ├── search/          # Recherche
│   │       ├── reviews/         # Reviews
│   │       └── ai/logo/         # Génération logo IA
│   ├── components/
│   │   ├── layout/              # Header, Footer
│   │   ├── ui/                  # Loader, ErrorBoundary, etc.
│   │   ├── bands/               # BandCard, BandDetailClient, AlbumCard, etc.
│   │   ├── search/              # SearchBar, SearchResultsClient
│   │   ├── gamification/        # XPBar, LevelUpModal, PlayerCard, TimelineBadgesPanel, etc.
│   │   ├── reviews/             # ReviewForm, ReviewList
│   │   ├── widgets/             # ConcertsWidget, SpotifyEmbed
│   │   ├── visual/              # StatsPanel, AudioRadar, SimilarityGraph
│   │   ├── map/                 # MetalMapClient
│   │   ├── timeline/            # TimelineClient, TableOfKnowledge
│   │   ├── graph/               # GraphClient (wrapper SimilarityGraph)
│   │   ├── audio/               # AudioClient (wrapper AudioRadar)
│   │   └── ai/                  # AILogoGenerator
│   ├── stores/                  # Zustand stores
│   │   ├── favoritesStore.ts    # Favoris local-first
│   │   ├── statsStore.ts        # Statistiques
│   │   ├── uiStore.ts           # UI state
│   │   ├── gamificationStore.ts # XP, rangs, quêtes
│   │   ├── fragmentStore.ts     # 🆕 Fragments Timeline (85 à collecter)
│   │   ├── achievementStore.ts  # 🆕 Badges Timeline (14 badges)
│   │   ├── classStore.ts        # 🆕 Classes de personnages
│   │   └── notificationStore.ts # Toasts et célébrations
│   ├── lib/
│   │   ├── supabase.ts          # Client Supabase
│   │   ├── metal-api.ts         # Client API interne
│   │   ├── cache.ts             # Cache mémoire
│   │   ├── offline-sync.ts      # Sync offline
│   │   ├── d3-utils.ts          # Utilitaires D3
│   │   ├── audio/               # 🆕 audioMetrics.ts (logique AcousticBrainz + Last.fm)
│   │   └── gamification/        # Lore, badges, quests, engine, timeline-badges.ts
│   ├── api/                     # Hooks React Query
│   │   ├── hooks.ts             # 🆕 useAudioFeatures, useSimilarBands
│   │   ├── authApi.ts           # Authentification
│   │   ├── reviewsApi.ts        # Reviews
│   │   └── concertsApi.ts       # Concerts
│   ├── types/                   # Types TypeScript
│   │   ├── api.ts               # 🆕 Band, Album, BandMember, etc.
│   │   └── supabase.ts          # Types Supabase générés
│   └── i18n/                    # Internationalisation
│       ├── index.ts
│       └── locales/
│           ├── fr.json
│           └── en.json
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── next.config.mjs              # Config Next.js (CSP, images, PWA)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🔌 API

### Endpoints internes (Next.js Route Handlers)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/bands/:id` | Détails d'un groupe (cache 1h) |
| GET | `/api/search?q=...` | Recherche de groupes |
| POST | `/api/recommendations` | Recommandations ML |
| POST | `/api/ai/logo` | Génération de logo IA |

### ML Service (FastAPI)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/similar-bands` | Groupes similaires |
| POST | `/recommendations` | Recommandations personnalisées |
| POST | `/audio-features` | Features audio Spotify |

### Exemple d'appel

```bash
# Recherche de groupes
curl "http://localhost:3000/api/search?q=iron+maiden"

# Recommandations ML
curl -X POST "http://localhost:8000/similar-bands" \
  -H "Content-Type: application/json" \
  -d '{"band": {"band_id": 1, "name": "Iron Maiden", "genre": "Heavy Metal", "country": "UK"}, "limit": 5}'
```

---

## 🚀 Déploiement

### Vercel (Frontend)

1. Importez le repo sur [Vercel](https://vercel.com)
2. Configurez les variables d'environnement
3. Déployez

```bash
npm install -g vercel
vercel --prod
```

### Railway / Render (ML Service)

```bash
cd ml-service
# Suivez les instructions de votre plateforme
# Build: docker build -t metalpedia-ml .
# Commande: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Supabase (Database)

Supabase est un service managé, aucune action de déploiement nécessaire. Configurez simplement les variables d'environnement.

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Couverture
npm run test:coverage
```

---

## 🗺 Roadmap

- [x] **Phase 1** : Stabilisation (React Query, Error Boundaries)
- [x] **Phase 2** : UX avancée (Favoris, thèmes, i18n, Command Palette)
- [x] **Phase 3** : Communauté (Auth, Reviews, Concerts)
- [x] **Phase 4** : Performance (Next.js 15, PWA, virtualisation)
- [x] **Phase 5** : Intelligence (ML, D3, Spotify, IA)
- [x] **Phase 6** : Gamification (Système RPG complet avec lore)
- [x] **Phase 7** : Industrialisation (Docker, CI/CD, ESLint)
- [ ] **Phase 8** : Tests complets (Jest + Playwright)
- [ ] **Phase 9** : Mobile App (React Native)
- [ ] **Phase 10** : API GraphQL unifiée

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

1. **Fork** le projet
2. **Créez** une branche (`git checkout -b feature/amelioration`)
3. **Commit** vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/amelioration`)
5. **Ouvrez** une Pull Request

### Convention de commits

```
feat: ajout d'une nouvelle fonctionnalité
fix: correction d'un bug
docs: modification de la documentation
style: formatage du code
refactor: refactoring
test: ajout de tests
chore: tâches de maintenance
```

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Last.fm](www.last.fm) — Source de données originelle
- [MusicBrainz](https://musicbrainz.org/) — Source de données originelle
- [OpenAI](https://openai.com) — Pour la génération d'images
- Toute la communauté metal 🤘

---

<div align="center">

**Made with 🤘 and ☕ by MetalPedia Team**

*Que le Premier Riff te guide, Métalleux.*

</div>
