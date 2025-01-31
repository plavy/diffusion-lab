FROM node:23

ENV NODE_ENV production

WORKDIR /app

COPY ./package*.json ./
RUN npm install

COPY . .
RUN npm build

CMD ["npm", "serve"]