FROM node:16

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 8010

CMD [ "node", "index.js" ]