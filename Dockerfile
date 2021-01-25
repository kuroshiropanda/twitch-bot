FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY ./ ./
RUN npx tsc
EXPOSE 3000 42394
VOLUME [ "/images" ]
CMD ["node","dist/index.js"]