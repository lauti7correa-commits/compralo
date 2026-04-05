FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN echo "Build $(date +%s)" > /tmp/build_info && \
    cat index.html | grep -c "Array.isArray" && \
    echo "index.html OK - unwrap present"

RUN node init-db.js

EXPOSE 3001

CMD ["node", "server.js"]
