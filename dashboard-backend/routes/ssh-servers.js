const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const getAuth = require('../utils').getAuth;
const listDirectory = require('../utils').listDirectory;
const getFileContent = require('../utils').getFileContent;

const SSH2Promise = require('ssh2-promise');
const { Client } = require('node-scp');
const { toSSHConfig } = require('../utils');

const serverDir = 'diffusion-lab/ssh-servers/';
const webdavPath = '/remote.php/webdav/';
const metadataFile = 'metadata.json';
const scriptsDir = 'diffusion-lab/scripts/'


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
        try {
            const ssh = new SSH2Promise(toSSHConfig(response.data));
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

router.post('/:id/sync', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {
        const response1 = await getFileContent(auth.baseUrl + webdavPath + serverDir + id + '/' + metadataFile, auth.username, auth.password);
        const sshConfig = toSSHConfig(response1.data);

        const parser = new xml2js.Parser();
        const response2 = await listDirectory(auth.baseUrl + webdavPath + scriptsDir, auth.username, auth.password);
        // Parse the XML response to a JS object
        const parsedData = await parser.parseStringPromise(response2.data);
        const files = parsedData['d:multistatus']['d:response']
            .map(item => item['d:href'][0])
            .filter(item => item != webdavPath + scriptsDir);

        const ssh = new SSH2Promise(sshConfig);
        await ssh.exec(`mkdir -p ${scriptsDir}`);

        for (const scriptPath of files) {
            try {
                const response = await getFileContent(auth.baseUrl + scriptPath, auth.username, auth.password);
                const data = response.data;

                const scriptName = scriptPath.split("/").pop();
                const scp = await Client(sshConfig);
                await scp.writeFile(`${scriptsDir}/${scriptName}`, data);
                scp.close();
            } catch (e) {
                console.error(e);
            }
        }
        res.json({ code: 0 })
    } catch (e) {

    }



})

module.exports = router;