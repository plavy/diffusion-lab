# Diffusion Lab

Diffusion Lab is a distributed system composed of:
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