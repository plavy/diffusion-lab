# Diffusion Lab

<svg width="590" height="120" viewBox="0 0 590 120" xmlns="http://www.w3.org/2000/svg" fill="none">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:darkviolet; stop-opacity:1" />
      <stop offset="100%" style="stop-color:orange; stop-opacity:1" />
    </linearGradient>
  </defs>
  <text x="0" y="100" font-family="Arial" font-size="100" fill="url(#grad1)">Diffusion Lab</text>
</svg>

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