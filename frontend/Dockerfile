FROM node:23

ENV NODE_ENV production

WORKDIR /app

COPY ./package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "run", "serve"]

EXPOSE 3000