<div align="center">

# 🤘 MetalPedia

### L'encyclopédie du Metal avec gamification épique

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Explorez les groupes de metal, gagnez de l'XP, collectionnez des reliques et devenez le DIEU DU METALVERSE.**

</div>

---

## 📖 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Système de Gamification](#-système-de-gamification)
- [Stack Technique](#-stack-technique)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Utilisation](#-utilisation)
- [Scripts disponibles](#-scripts-disponibles)
- [Structure du projet](#-structure-du-projet)
- [API](#-api)
- [Déploiement](#-déploiement)
- [Tests](#-tests)
- [Roadmap](#-roadmap)
- [Contribuer](#-contribuer)
- [Licence](#-licence)
- [Remerciements](#-remerciements)

---

## 🎯 Aperçu

**MetalPedia** est une encyclopédie dédiée aux groupes de metal.

Au-delà d'une simple base de données, MetalPedia transforme l'exploration musicale en une **aventure RPG** : gagnez de l'XP en découvrant des groupes, accomplissez des quêtes épiques, collectionnez des reliques légendaires et gravissez les échelons de la Hiérarchie du Riff.

### ✨ Ce qui rend MetalPedia unique

| Fonctionnalité | Description |
|----------------|-------------|
| 🤖 **Recommandations ML** | Moteur de similarité basé sur les embeddings Spotify |
| 🕸️ **Graphes interactifs** | Visualisation D3.js force-directed des groupes liés |
| 🎧 **Analyse audio** | Empreinte musicale (BPM, énergie, valence) via Spotify |
| 🎨 **Générateur IA** | Créez des logos de groupes avec OpenAI |
| 🌍 **Metal Map 3D** | Globe interactif de la densité metal par pays |
| 📜 **Timeline historique** | 60 ans d'histoire du metal (1968-2026) |
| 🎮 **Gamification RPG** | XP, niveaux, badges, quêtes avec lore immersif |
| 📱 **PWA Offline-first** | Installable, fonctionne hors ligne |

---

## ✨ Fonctionnalités

### 🔍 Exploration & Recherche

- ✅ **Recherche instantanée** avec autocomplétion (debounce 400ms)
- ✅ **Command Palette** (`Ctrl+K`) pour navigation rapide
- ✅ **Filtres par genre** : Black, Death, Heavy, Thrash, Power, Doom, Progressive, Folk Metal
- ✅ **Fiches détaillées** : biographie, discographie, line-up actuel/passé, liens externes
- ✅ **Critiques communautaires** avec système de notation

### 🤖 Intelligence Artificielle

- ✅ **Recommandations ML** : similarité cosinus sur embeddings Spotify
- ✅ **Graphe de similarité** : visualisation D3.js force-directed interactive
- ✅ **Audio Fingerprint** : analyse BPM, énergie, valence, danceabilité
- ✅ **Générateur de logos IA** : création de logos via OpenAI GPT-Image

### 📊 Data & Visualisations

- ✅ **Metal Map 3D** : globe react-globe.gl avec densité par pays
- ✅ **Timeline historique** : chronologie interactive vis-timeline
- ✅ **ADN Metal personnel** : statistiques de consultation avec radar chart
- ✅ **Dataset public** : export vers HuggingFace et Kaggle

### 👥 Communauté

- ✅ **Authentification Supabase** (email + OAuth GitHub/Google)
- ✅ **Reviews et notations** : critiques avec barre de progression
- ✅ **Profils gamifiés** : page personnelle avec XP et badges
- ✅ **Concerts** : intégration Songkick pour les événements à venir

### 📱 Expérience Utilisateur

- ✅ **PWA complète** : installable, offline-first, push notifications
- ✅ **Mode offline** : sync automatique des favoris au retour en ligne
- ✅ **4 thèmes visuels** : Forge, Cathédrale, Hellfire, Frost
- ✅ **Responsive** : mobile-first, 1 à 4 colonnes
- ✅ **i18n** : français et anglais

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

### 🏅 Reliques (Badges)

| Rareté | Nombre | Exemples |
|--------|--------|----------|
| ⚪ Common | 3 | Premier Sang, Esprit Curieux, Collectionneur |
| 🔵 Rare | 5 | True Necro, Thrash Berserker, Explorateur des Royaumes |
| 🟣 Epic | 3 | Gardien du Savoir, Chef de Horde, Maître du Lore |
| 🟠 Legendary | 2 | Élu des Anciens, Restaureur des Tables |

### 📜 Quêtes Épiques

| Difficulté | Nombre | Exemples |
|------------|--------|----------|
| 🟢 Novice | 2 | Premiers Pas, Première Étoile |
| 🔵 Apprentice | 4 | Initiation au Black Metal, Épreuve du Thrash |
| 🟣 Master | 3 | Chercheur de Savoir, Premier Sortilège |
| 🟠 Legendary | 3 | Restaureur des Tables, Légion du Metal |

---

## 🛠 Stack Technique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| [Next.js](https://nextjs.org) | 15.1 | Framework React SSR/ISR |
| [React](https://react.dev) | 18.2 | Bibliothèque UI |
| [TypeScript](https://www.typescriptlang.org) | 5.3 | Typage statique |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Styling |
| [Zustand](https://zustand-demo.pmnd.rs) | 4.4 | State management |
| [TanStack Query](https://tanstack.com/query) | 5.17 | Data fetching + cache |
| [D3.js](https://d3js.org) | 7.8 | Visualisations |
| [Recharts](https://recharts.org) | 2.10 | Charts |
| [react-globe.gl](https://github.com/vasturiano/react-globe.gl) | 2.27 | Globe 3D |
| [vis-timeline](https://visjs.org) | 7.7 | Timeline historique |
| [i18next](https://www.i18next.com) | 23.7 | Internationalisation |

### Backend & Services

| Technologie | Usage |
|-------------|-------|
| [Supabase](https://supabase.com) | Auth, PostgreSQL, Storage, Realtime |
| [Python FastAPI](https://fastapi.tiangolo.com) | Microservice ML |
| [Redis](https://redis.io) | Cache distribué |

### APIs Externes

| API | Usage |
|-----|-------|
| [metal-api.dev](https://www.metal-api.dev) | Données des groupes |
| [Spotify Web API](https://developer.spotify.com) | Audio features |
| [OpenAI API](https://platform.openai.com) | Génération de logos |
| [Songkick API](https://www.songkick.com/developer) | Concerts |

---

## 🏗 Architecture

### Flux de données

1. **Recherche/Consultation** : Next.js → Supabase Database
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
├── ml-service/                    # Microservice Python FastAPI
│   ├── app/
│   │   ├── main.py               # Endpoints API
│   │   ├── spotify_client.py     # Client Spotify
│   │   ├── embeddings.py         # Génération embeddings
│   │   └── recommendations.py    # Moteur de reco
│   ├── Dockerfile
│   └── requirements.txt
├── public/
│   ├── icon.svg                  # Icône source
│   ├── icons/                    # Icônes PWA générées
│   ├── manifest.json             # Manifest PWA
│   └── offline.html              # Page offline
├── scripts/
│   ├── generate-icons.mjs        # Génération icônes
│   ├── export_dataset.py         # Export dataset
│   └── upload_huggingface.py     # Upload HuggingFace
├── src/
│   ├── app/                      # App Router Next.js
│   │   ├── layout.tsx           # Layout racine
│   │   ├── page.tsx             # Accueil
│   │   ├── band/[id]/           # Fiche groupe
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
│   │       ├── bands/[id]/
│   │       ├── search/
│   │       ├── recommendations/
│   │       └── ai/logo/
│   ├── components/
│   │   ├── layout/              # Header, Footer
│   │   ├── ui/                  # Loader, ErrorBoundary, etc.
│   │   ├── bands/               # BandCard, AlbumCard, etc.
│   │   ├── search/              # SearchBar
│   │   ├── gamification/        # XPBar, LevelUpModal, etc.
│   │   ├── social/              # ReviewForm, AuthModal
│   │   ├── widgets/             # ConcertsWidget, SpotifyEmbed
│   │   ├── visual/              # StatsPanel, AudioRadar, SimilarityGraph
│   │   ├── map/                 # MetalMapClient
│   │   ├── timeline/            # TimelineClient
│   │   └── ai/                  # AILogoGenerator
│   ├── stores/                  # Zustand stores
│   │   ├── favoritesStore.ts
│   │   ├── statsStore.ts
│   │   ├── uiStore.ts
│   │   └── gamificationStore.ts
│   ├── lib/
│   │   ├── supabase.ts          # Client Supabase
│   │   ├── metal-api.ts         # Client metal-api.dev
│   │   ├── cache.ts             # Cache mémoire
│   │   ├── offline-sync.ts      # Sync offline
│   │   ├── d3-utils.ts          # Utilitaires D3
│   │   └── gamification/        # Lore, badges, quests, engine
│   ├── api/                     # Hooks React Query
│   │   ├── hooks.ts
│   │   ├── authApi.ts
│   │   ├── reviewsApi.ts
│   │   ├── concertsApi.ts
│   │   └── spotify.ts
│   ├── types/                   # Types TypeScript
│   │   ├── api.ts
│   │   └── supabase.ts
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
├── next.config.mjs
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

- [Last.fm](www.last.fm) — La source de données originelle
- [Spotify](https://developer.spotify.com) — Pour les audio features
- [OpenAI](https://openai.com) — Pour la génération d'images
- Toute la communauté metal 🤘

---

<div align="center">

**Made with 🤘 and ☕ by MetalPedia Team**

*Que le Premier Riff te guide, Métalleux.*

</div>
