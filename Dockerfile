FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN node init-db.js

EXPOSE 3001

CMD ["node", "server.js"]
