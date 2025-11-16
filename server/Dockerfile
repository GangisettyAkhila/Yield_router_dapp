FROM node:18-alpine
WORKDIR /usr/src/app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production

# copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "src/index.js"]
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
