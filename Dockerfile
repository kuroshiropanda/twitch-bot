FROM node:15 AS build
USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node ./ ./
RUN npm run build

FROM node:lts-alpine
USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node --from=build /home/node/app/.env /home/node/app/dist /home/node/app/*.json ./
RUN npm ci --production
EXPOSE 3000 8080
VOLUME [ "/images", "/logs", "/home/node/app/data" ]
CMD [ "node", "index.js" ]