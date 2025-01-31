FROM node:23

ARG SSH_PRIVATE_KEY
ARG SSH_PUBLIC_KEY

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV SSH_PRIVATE_KEY_PATH=ssh_private_key.pem
RUN echo "${SSH_PRIVATE_KEY}" > ssh_private_key.pem && chmod 600 ssh_private_key.pem
RUN echo "${SSH_PUBLIC_KEY}" > ssh_public_key.pem

EXPOSE 8000
CMD [ "npm", "start" ]
