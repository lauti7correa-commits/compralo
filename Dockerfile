FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN sed -i 's/allProducts = await res.json()/const json = await res.json(); allProducts = json.data || []/' index.html \
 && sed -i 's/max="3000000" value="3000000"/max="5000000" value="5000000"/g' index.html \
 && sed -i 's/let maxPrice = 3000000/let maxPrice = 5000000/' index.html \
 && node init-db.js

EXPOSE 3001

CMD ["node", "server.js"]
