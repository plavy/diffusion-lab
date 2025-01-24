const express = require('express');
const app = express();
const cors = require('cors');


const processAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');

    const baseUrl = 'https://' + auth[0];
    const username = auth[1];
    const password = auth[2];
    req.auth = { baseUrl: baseUrl, username: username, password: password };
  } catch (error) {
    return res.status(401).send('Basic Authentaction with URL is required.');
  }
  next();
};

app.use(cors());
app.use(express.json());
app.use(processAuth);

app.get('/', (req, res) => {
  res.send('hello')
})

// Routes
const datasetsRoute = require('./routes/datasets');
app.use('/datasets', datasetsRoute);
const downsizingsRoute = require('./routes/downsizings');
app.use('/downsizings', downsizingsRoute);
const augmentationsRoute = require('./routes/augmentations');
app.use('/augmentations', augmentationsRoute);
const sshServersRoute = require('./routes/ssh-servers');
app.use('/servers', sshServersRoute);

const port = process.env.port || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


