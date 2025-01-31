FROM node:23

ENV NODE_ENV production

WORKDIR /app

COPY ./package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]