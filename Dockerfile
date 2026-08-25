# ═══════════════════════════════════════════
# ÉTAPE 1 : Dépendances
# ═══════════════════════════════════════════
FROM node:20-alpine AS deps

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm ci --only=production && \
    npm cache clean --force

# ═══════════════════════════════════════════
# ÉTAPE 2 : Build
# ═══════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les dépendances de l'étape précédente
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Désactiver la télémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Build de l'application
RUN npm run build

# ═══════════════════════════════════════════
# ÉTAPE 3 : Production
# ═══════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copier le build Next.js (standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
