FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

RUN git clone --branch compralo-cambios --single-branch https://github.com/lauti7correa-commits/compralo.git .

RUN npm ci --omit=dev

RUN node init-db.js

EXPOSE 3001

CMD ["node", "server.js"]
