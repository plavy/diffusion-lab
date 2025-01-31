FROM node:23

COPY package*.json ./
RUN npm install

COPY . .

CMD [ "npm", "start" ]

EXPOSE 8000