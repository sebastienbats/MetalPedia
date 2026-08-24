# 🤘 MetalPedia

> **Encyclopédie collaborative des groupes de Metal avec gamification épique** — 170 000+ groupes référencés, recommandations ML, visualisations interactives, mode offline-first et système de progression RPG.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Infrastructure](#-infrastructure)
- [Installation](#-installation)
- [Déploiement](#-déploiement)
- [API](#-api)
- [Système de Gamification](#-système-de-gamification)
- [Datasets publics](#-datasets-publics)
- [Roadmap](#-roadmap)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## ✨ Fonctionnalités

### 🔍 Exploration & Recherche
- **Recherche instantanée** avec autocomplétion (debounce 400ms)
- **Command Palette** (Ctrl+K) pour navigation rapide
- **Filtres par genre** : Black, Death, Heavy, Thrash, Power, Doom, Progressive, Folk
- **Fiches détaillées** : biographie, discographie, line-up, liens externes

### 🤖 Intelligence Artificielle
- **Recommandations ML** : similarité cosinus sur embeddings Spotify
- **Graphe de similarité** : visualisation D3.js force-directed interactive
- **Audio Fingerprint** : analyse BPM, énergie, valence via Spotify Web API
- **Générateur de logos IA** : création de logos de groupes via GPT-Image

### 📊 Data & Visualisations
- **Metal Map 3D** : globe interactif avec densité de groupes par pays
- **Timeline historique** : 60 ans d'histoire du metal (1968-2026)
- **ADN Metal personnel** : statistiques de consultation avec radar chart
- **Dataset public** : export vers HuggingFace et Kaggle

### 🎮 Gamification (Système RPG)
- **8 rangs épiques** : de Novice du Silence à DIEU DU METALVERSE
- **Système d'XP** : gagne des points en explorant, ajoutant des favoris, écrivant des reviews
- **13 reliques à collectionner** : badges avec rareté (common, rare, epic, legendary)
- **12 quêtes épiques** : missions avec lore immersif
- **Bonus quotidien** : bénédiction des Anciens chaque jour
- **Modal de level up** : animation épique avec effets visuels

### 👥 Communauté
- **Authentification** : Supabase Auth (email, OAuth)
- **Reviews** : critiques et notations d'albums/groupes
- **Profils** : pages utilisateurs avec stats et favoris
- **Concerts** : intégration Songkick pour les événements à venir

### 📱 Expérience Utilisateur
- **PWA complète** : installable, offline-first, push notifications
- **Mode offline** : sync automatique des favoris au retour en ligne
- **4 thèmes** : Forge, Cathédrale, Hellfire, Frost
- **Responsive** : mobile-first, 1 à 4 colonnes selon l'écran
- **i18n** : français et anglais

---

## 📁 Structure du projet
```txt
metal-pedia/
├── README.md
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .gitignore
├── LICENSE
├── public/
│   ├── manifest.json
│   ├── offline.html
│   ├── sw.js
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-512-maskable.png
├── ml-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── spotify_client.py
│       ├── embeddings.py
│       └── recommendations.py
├── scripts/
│   ├── export_dataset.py
│   └── upload_huggingface.py
└── src/
    ├── middleware.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── providers.tsx
    │   ├── globals.css
    │   ├── band/[id]/page.tsx
    │   ├── search/[query]/page.tsx
    │   ├── favorites/page.tsx
    │   ├── profile/page.tsx
    │   ├── map/page.tsx
    │   ├── timeline/page.tsx
    │   ├── ai/page.tsx
    │   ├── graph/[bandId]/page.tsx
    │   ├── audio/[bandId]/page.tsx
    │   └── api/
    │       ├── bands/[id]/route.ts
    │       ├── search/route.ts
    │       ├── recommendations/route.ts
    │       └── ai/logo/route.ts
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx
    │   │   └── Footer.tsx
    │   ├── ui/
    │   │   ├── Loader.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── CommandPalette.tsx
    │   │   ├── ThemeSwitcher.tsx
    │   │   └── OfflineIndicator.tsx
    │   ├── bands/
    │   │   ├── BandCard.tsx
    │   │   ├── BandGrid.tsx
    │   │   ├── AlbumCard.tsx
    │   │   └── BandDetailClient.tsx
    │   ├── search/
    │   │   └── SearchBar.tsx
    │   ├── visual/
    │   │   ├── SimilarityGraph.tsx
    │   │   ├── AudioRadar.tsx
    │   │   └── StatsPanel.tsx
    │   ├── social/
    │   │   ├── ReviewForm.tsx
    │   │   ├── ReviewList.tsx
    │   │   └── AuthModal.tsx
    │   ├── widgets/
    │   │   ├── SpotifyEmbed.tsx
    │   │   └── ConcertsWidget.tsx
    │   └── gamification/
    │       ├── XPBar.tsx
    │       ├── LevelUpModal.tsx
    │       ├── BadgesPanel.tsx
    │       ├── QuestsPanel.tsx
    │       └── PlayerCard.tsx
    ├── stores/
    │   ├── favoritesStore.ts
    │   ├── statsStore.ts
    │   ├── uiStore.ts
    │   └── gamificationStore.ts
    ├── lib/
    │   ├── cache.ts
    │   ├── metal-api.ts
    │   ├── supabase.ts
    │   ├── offline-sync.ts
    │   ├── d3-utils.ts
    │   ├── sentry.ts
    │   └── gamification/
    │       ├── lore.ts
    │       ├── badges.ts
    │       ├── quests.ts
    │       └── engine.ts
    ├── api/
    │   ├── hooks.ts
    │   ├── authApi.ts
    │   ├── reviewsApi.ts
    │   ├── concertsApi.ts
    │   └── spotify.ts
    ├── types/
    │   ├── api.ts
    │   └── supabase.ts
    └── i18n/
        ├── index.ts
        └── locales/
            ├── fr.json
            └── en.json
```

---

## 🏗️ Architecture
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ METALPEDIA ARCHITECTURE │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ FRONTEND (Next.js 15) ││
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ││
│ │ │ App Router │ │ RSC + │ │ PWA + │ │ Zustand │ ││
│ │ │ (SSR/ISR) │ │ Streaming │ │ Service │ │ Stores │ ││
│ │ │ │ │ │ │ Worker │ │ │ ││
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│ │ │
│ ▼ │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ BACKEND & SERVICES ││
│ │ ││
│ │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐ ││
│ │ │ metal-api.dev │ │ Supabase │ │ ML Service │ ││
│ │ │ (Proxy + Cache) │ │ (Auth, DB, │ │ (FastAPI + │ ││
│ │ │ │ │ Storage) │ │ Spotify API) │ ││
│ │ └──────────────────┘ └──────────────────┘ └──────────────────────┘ ││
│ │ ││
│ │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐ ││
│ │ │ Spotify Web API │ │ Songkick API │ │ OpenAI API │ ││
│ │ │ (Audio Features)│ │ (Concerts) │ │ (Logo Generation) │ ││
│ │ └──────────────────┘ └──────────────────┘ └──────────────────────┘ ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│ │ │
│ ▼ │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ DATA LAYER ││
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ││
│ │ │ HuggingFace │ │ Kaggle │ │ Redis Cache │ │ IndexedDB │ ││
│ │ │ Datasets │ │ Dataset │ │ (Prod) │ │ (Client) │ ││
│ │ └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│ │
└─────────────────────────────────────────────────────────────────────────────┘

```

### Stack Technique
| Couche | Technologie | Usage |
|--------|-------------|-------|
| **Frontend** | Next.js 15, React 18, TypeScript | Framework SSR/ISR |
| **Styling** | Tailwind CSS | Design system dark/metal |
| **State** | Zustand + TanStack Query | State management + cache |
| **Visualisation** | D3.js, Recharts, vis-timeline, react-globe.gl | Graphiques interactifs |
| **Backend** | Supabase (PostgreSQL) | Auth, DB, Storage |
| **ML Service** | Python FastAPI | Recommandations, embeddings |
| **APIs externes** | metal-api.dev, Spotify, Songkick, OpenAI | Données et IA |
| **Offline** | Service Worker + IndexedDB | PWA offline-first |
| **i18n** | react-i18next | Multilingue |

---

## ☁️ Infrastructure

### Déploiement actuel

| Service | Plateforme | URL |
|---------|-----------|-----|
| Frontend | Vercel | https://metalpedia.vercel.app |
| ML Service | Railway | https://metalpedia-ml.up.railway.app |
| Base de données | Supabase | Dashboard privé |
| Cache | Upstash Redis | Redis serverless |
| Monitoring | Sentry | Erreurs + replay |

### Variables d'environnement requises

```env
# Frontend
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ML_SERVICE_URL=

# ML Service
SPOTIFY_CLIENT_ID=
```

---

## 🚀 Installation
### Prérequis
Node.js ≥ 20
Python 3.11+ (pour le ML service)
Docker (optionnel)
### 1. Cloner et installer
```bash
git clone https://github.com/sebastienbats/MetalPedia.git
cd metal-pedia
npm install
```
### 2. Configuration
```bash
cp .env.example .env.local
# Remplir les variables dans .env.local

cp ml-service/.env.example ml-service/.env
# Remplir les variables Spotify
```
### 3. Lancer en développement
```bash
# Terminal 1 : Frontend
npm run dev

# Terminal 2 : ML Service
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
### 4. Build de production
```bash
npm run build
npm start
```

---
## 📦 Déploiement
### Frontend (Vercel)
```bash
npm install -g vercel
vercel --prod
```
### ML Service (Docker)
```bash
cd ml-service
docker build -t metalpedia-ml .
docker run -p 8000:8000 --env-file .env metalpedia-ml
```
### ML Service (Railway)
```bash
railway init
railway add SPOTIFY_CLIENT_ID SPOTIFY_CLIENT_SECRET
railway up
```

---

## 🔌 API
### Endpoints internes (Next.js API Routes)
|Méthode|Endpoint|Description|
|-------|--------|-----------|
|GET|/api/bands/:id|Détails d'un groupe (cache 1h)|
|GET|/api/search?q=...|Recherche de groupes|
|POST|/api/recommendations|Recommandations ML|
|POST|/api/ai/logo|Génération de logo IA|

### ML Service (FastAPI)
|Méthode|Endpoint|Description|
|-------|--------|-----------|
|GET|/health|Health check|
|POST|/similar-bands|Groupes similaires|
|POST|/recommendations|Recommandations personnalisées|
|POST|/audio-features|Features audio Spotify|

---

## 📊 Datasets publics
Le projet exporte régulièrement ses données vers des plateformes publiques :
- HuggingFace : https://huggingface.co/datasets/votre-username/metalpedia-bands
- Kaggle : https://www.kaggle.com/datasets/votre-username/metalpedia-bands
### Schéma du dataset
|Colonne|Type|Description|
|-------|----|-----------|
|band_id|int|Identifiant unique|
|name|string|Nom du groupe|
|genre|string|Genre principal|
|country|string|Pays d'origine|
|formed|int|Année de formation|

## 📄 Licence
MIT License - voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements
- Encyclopaedia Metallum — La source de données originelle
- metal-api.dev — L'API REST qui rend tout possible
- Toute la communauté metal 🤘
