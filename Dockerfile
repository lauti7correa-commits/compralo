FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN echo "=== VERIFY FILES ===" && grep -c "Array.isArray" index.html && grep -c "no-cache" server.js && echo "=== END VERIFY ==="

RUN node init-db.js

EXPOSE 3001

CMD ["node", "server.js"]
