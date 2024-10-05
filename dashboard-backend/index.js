const express = require('express');
const app = express();

const { Client } = require('ssh2');
const conn = new Client();

const sshConfig = {
  host: 'napoleon.plavy.me',
  port: 22,
  username: 'plavy',
  privateKey: require('fs').readFileSync('/home/plavy/.ssh/id_rsa')
};

app.get('/', (req, res) => {
  res.send('hello')
})

// Routes
const datasetsRoute = require('./routes/datasets');
app.use('/datasets', datasetsRoute);

const port = process.env.port || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




// conn.on('ready', () => {
//   console.log('Client :: ready'); 
  
//   // Execute a command on the server
//   conn.exec('uptime', (err, stream) => {
//     if (err) throw err;
    
//     stream.on('close', (code, signal) => {
//       console.log(`Stream :: close :: code: ${code}, signal: ${signal}`);
//       conn.end(); // Close the connection
//     }).on('data', (data) => {
//       console.log(`STDOUT: ${data}`);
//     }).stderr.on('data', (data) => {
//       console.log(`STDERR: ${data}`);
//     });
//   });
// }).connect(sshConfig);
