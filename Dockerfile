FROM node:14.8.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY ./ ./
RUN npx tsc
EXPOSE 3000
CMD ["node","dist/index.js"]