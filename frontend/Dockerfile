FROM node:23 AS builder

ARG VITE_BACKEND_URL

WORKDIR /app

COPY ./package*.json ./
RUN npm install

COPY . .
RUN npm run build

# stage 2
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]