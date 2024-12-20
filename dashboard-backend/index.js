const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('hello')
})

// Routes
const datasetsRoute = require('./routes/datasets');
app.use('/datasets', datasetsRoute);
const sshServersRoute = require('./routes/ssh-servers');
app.use('/servers', sshServersRoute);

const port = process.env.port || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


