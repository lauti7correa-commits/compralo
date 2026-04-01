FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

ARG SOURCE_COMMIT=unknown
RUN echo "Deploying commit: ${SOURCE_COMMIT}" > /tmp/build_info

COPY . .

RUN cat index.html | grep -c "Array.isArray" && cat server.js | head -1

RUN node init-db.js

EXPOSE 3001

CMD ["node", "server.js"]
