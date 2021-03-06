FROM node:15.11.0 AS build
USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . ./
RUN npm run build

FROM node:15.11.0-alpine
USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package.json package-lock.json ./
RUN npm install --production
COPY --chown=node:node badges.json steam.json  ./
COPY --chown=node:node resources resources/
COPY --chown=node:node --from=build /home/node/app/dist ./
EXPOSE 3000 8080

VOLUME [ "/home/node/app/images", "/home/node/app/logs", "/home/node/app/data" ]
CMD [ "node", "index.js" ]