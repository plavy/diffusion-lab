const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const getAuth = require('../utils').getAuth;
const listDirectory = require('../utils').listDirectory;
const getFileContent = require('../utils').getFileContent;

const SSH2Promise = require('ssh2-promise');
const { Client } = require('node-scp');
const { hostname } = require('os');

const serverDir = 'diffusion-lab/ssh-servers/';
const webdavPath = '/remote.php/webdav/';
const metadataFile = 'metadata1.json';


router.get('/', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const parser = new xml2js.Parser();

    try {
        const response = await listDirectory(auth.baseUrl + webdavPath + serverDir, auth.username, auth.password);
        // Parse the XML response to a JS object
        const parsedData = await parser.parseStringPromise(response.data);
        const files = parsedData['d:multistatus']['d:response']
            .map(item => item['d:href'][0])
            .filter(item => item != webdavPath + serverDir);


        let servers = [];
        for (const serverPath of files) {

            try {
                const response = await getFileContent(auth.baseUrl + serverPath + metadataFile, auth.username, auth.password);
                const metadata = response.data;
                servers.push({
                    id: metadata.id,
                    name: metadata.name,
                });
            } catch (error) {
                console.error('Error retrieving file content:', error.message);
            }
        }
        res.json(servers);

    } catch (error) {
        console.error('Error listing directory contents:', error.message);
        res.status(400);
        res.send(error.message);
    }

});

router.get('/:id', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {
        const response = await getFileContent(auth.baseUrl + webdavPath + serverDir + id + '/' + metadataFile, auth.username, auth.password);
        const metadata = response.data;
        res.json({
            id: metadata.id,
            name: metadata.name,
            hostname: metadata.hostname,
            port: metadata.port,
            username: metadata.username
        });
    } catch (error) {
        console.error('Error retrieving file content:', error.message);
    }


});

router.get('/:id/status', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {
        const response = await getFileContent(auth.baseUrl + webdavPath + serverDir + id + '/' + metadataFile, auth.username, auth.password);
        const metadata = response.data;

        const sshConfig = {
            host: metadata.hostname,
            port: metadata.port,
            username: metadata.username,
            privateKey: require('fs').readFileSync('/home/plavy/.ssh/id_rsa')
        };

        try {
            const ssh = new SSH2Promise(sshConfig);
            await ssh.connect();
            ssh.close();

            res.json({ code: 0, message: "Server reachable" });
        } catch (e) {
            if (e.level == "client-authentication")
                res.json({ code: 1, message: "Authentication failed" });
            else
                res.json({ code: 1, message: "Server unreachable" });
            console.log(e);
        }

    } catch (error) {
        console.error('Error retrieving file content:', error.message);
    }
});

module.exports = router;