const express = require('express');
const router = express.Router();

const SSH2Promise = require('ssh2-promise');
const { Client } = require('node-scp')

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

router.get('/:id', async (req, res) => {
    try {
        const scp = await Client(sshConfig);
        await scp.uploadFile('scripts/echo.sh', 'echo.sh');
        scp.close();

        const ssh = new SSH2Promise(sshConfig);
        const data = await ssh.exec("bash echo.sh");
        ssh.close();
        
        res.json({ "detected-id": req.params.id, "sshResult": data.toString() })
    } catch (e) {
        console.log(e);
    }
})

module.exports = router;