## Dockerfile pour le service Node "service2"
## NOTE: dans ce repo, il n'y a pas de fichier source (ex: index.js) pour l'instant.
## Ce Dockerfile est une base: quand tu ajoutes le code, le `CMD` lancera `node index.js`.

FROM node:20-alpine
WORKDIR /app

# Installer uniquement les dépendances nécessaires
COPY package.json ./
RUN npm install --omit=dev

# Copier le code (et fichiers nécessaires). Exclut node_modules via .dockerignore.
COPY . .

EXPOSE 8081
ENV NODE_ENV=production
CMD ["node","index.js"]

