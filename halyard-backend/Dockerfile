FROM node:14.0.0-alpine3.10 as nodebuild
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# RUN yarn test --coverage

FROM node:14.0.0-alpine3.10 as noderun

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install --production
COPY --from=nodebuild /usr/src/app/server.js ./

EXPOSE 3000

CMD ["npm","run","start"]