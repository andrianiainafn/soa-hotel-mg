## Dockerfile pour le service Node "service4"

FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8083
ENV NODE_ENV=production
CMD ["node","index.js"]

