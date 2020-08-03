FROM node:current-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY ./ ./
RUN npx tsc -b
EXPOSE 3000
CMD ["node","build/src/index.js"]