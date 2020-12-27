FROM node:12.18.3

WORKDIR /usr/src/interfinex-backend

COPY package.json .
RUN npm install

COPY . /usr/src/interfinex-backend
COPY ./contracts/ /usr/src/interfinex-backend/src/contracts
RUN npx tsc

CMD [ "npm", "run", "start-mainnet" ]

EXPOSE 8080