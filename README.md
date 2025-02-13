# Diffusion Lab

Diffusion Lab is a distributed system for training and examining diffusion models on own datasets, and also for generating images from the trained models.

It is composed of:
- Central storage server
- Web app (Backend + Frontend)
- SSH servers for training

## Storage

For storage server, we recommend Nextcloud.

For example you can deploy it with [official Helm chart](https://nextcloud.github.io/helm).

## Backend

Backend is implemented in NodeJS.

To run it locally, navigate to `backend` directory and run:
```bash
npm install
npm start
```

You can also build the Docker image.

## Frontend

Frontend is implemented in Vite and React.

To run it locally, navigate to `frontend` directory and run:
```bash
npm install
npm start
```

You can also build the Docker image.