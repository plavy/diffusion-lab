const express = require('express');
const router = express.Router();

const { Client } = require('ssh2');

const sshConfig = {
    host: 'napoleon.plavy.me',
    port: 22,
    username: 'plavy',
    privateKey: require('fs').readFileSync('/home/plavy/.ssh/id_rsa')
};

router.get('/', (req, res) => {
    res.json([
        {
            name: "ZEMRIS",
            id: 1
        },
    ]);
});

router.get('/:id', (req, res) => {
    const conn = new Client();
    let sshResult = "";
    conn.on('ready', () => {
        console.log('Client :: ready');

        // Execute a command on the server
        conn.exec('ls', (err, stream) => {
            if (err) throw err;

            stream.on('close', (code, signal) => {
                console.log(`Stream :: close :: code: ${code}, signal: ${signal}`);
                conn.end();
                res.json({ "detected-id": req.params.id, "sshResult": sshResult })
            }).on('data', (data) => {
                console.log(`STDOUT: ${data}`);
                sshResult = data.toString();
            }).stderr.on('data', (data) => {
                console.log(`STDERR: ${data}`);
            });
        });
    }).connect(sshConfig);
})

module.exports = router;