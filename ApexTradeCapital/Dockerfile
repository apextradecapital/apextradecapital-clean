# =========================
# DOCKERFILE : APEX TRADE CAPITAL
# =========================
FROM node:18-alpine AS base
WORKDIR /srv/app

# Copie du backend et du frontend
COPY ./backend ./backend
COPY ./ ./

# Installation backend + frontend
RUN cd backend && npm install
RUN npm install

# Exposition de ports limités
EXPOSE 3000
EXPOSE 5173

# Sécurité : utilisateur non-root
RUN addgroup -S apex && adduser -S apex -G apex
USER apex

# Démarrage simultané backend + frontend
CMD node backend/server.js & npm run dev -- --host 0.0.0.0
