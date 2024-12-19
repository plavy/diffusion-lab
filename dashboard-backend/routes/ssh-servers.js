const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const getAuth = require('../utils').getAuth;
const listDirectory = require('../utils').listDirectory;
const getFileContent = require('../utils').getFileContent;

const DAVClient = require('webdav').createClient;
const pLimit = require('p-limit');

const SSH2Promise = require('ssh2-promise');
const SCPClient = require('node-scp').Client;
const { toSSHConfig } = require('../utils');

const serverDir = 'diffusion-lab/ssh-servers/';
const webdavPath = '/remote.php/webdav/';
const metadataFile = 'metadata.json';
const scriptsDir = 'diffusion-lab/scripts/'
const datasetDir = 'diffusion-lab/datasets/';
const trainedModelsDir = 'trained_models';


// List SSH servers
router.get('/', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    try {
        const dav = DAVClient(auth.baseUrl + webdavPath, auth)
        const response = await dav.getDirectoryContents(serverDir);
        const servers = await Promise.all(
            response
                .filter(file => file.type == 'directory')
                .map(async file => {
                    const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
                    return {
                        id: metadata.id,
                        name: metadata.name
                    }
                }))
        res.json(servers);

    } catch (error) {
        console.error('Error for / :', error.message);
        res.status(400);
        res.send(error.message);
    }

});

// Get config of SSH server
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

// Get status of SSH server
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
            // console.log(e);
        }

    } catch (error) {
        console.error('Error retrieving file content:', error.message);
    }
});

// Sync files from nextcloud to SSH server
router.post('/:id/sync', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {

        const dav = DAVClient(auth.baseUrl + webdavPath, auth)
        const response1a = await dav.getDirectoryContents(scriptsDir, { deep: true });
        const response1b = await dav.getDirectoryContents(datasetDir, { deep: true });
        const response1 = [...response1a, ...response1b];
        const dirs = response1.filter(file => file.type == 'directory');
        const files = response1.filter(file => file.type == 'file');

        const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
        const ssh = new SSH2Promise(sshConfig);
        for (const dir of dirs) {
            await ssh.exec(`mkdir -p ${dir.filename.replace(/^\/+/, '')}`);
        }

        try {
            const scp = await SCPClient(sshConfig);
            console.time('syncServer');
            const concurrencyLimit = pLimit(10);
            const tasks = files.map(async file => concurrencyLimit(async () => {
                const response2 = await dav.getFileContents(file.filename);
                await scp.writeFile(file.filename.replace(/^\/+/, ''), response2);
            }));
            await Promise.all(tasks);
            console.timeEnd('syncServer');
            scp.close();
        } catch (e) {
            console.error(e);
        }

        console.time('runSetup');
        await ssh.exec(`cd ${scriptsDir}; bash ~/${scriptsDir}/setup.sh;`);
        console.timeEnd('runSetup');
        ssh.close();
        res.json({ code: 0 });
    } catch (e) {
        console.error(e);
        res.json({ code: 1 });
    }

})

// List trained models
router.get('/:id/models/:dsId', async (req, res) => {
    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    const datasetId = req.params.dsId;

    try {
        const dav = DAVClient(auth.baseUrl + webdavPath, auth);
        const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
        const ssh = new SSH2Promise(sshConfig);

        const sftp = ssh.sftp();
        const response2 = await sftp.readdir(`${datasetDir}/${datasetId}/${trainedModelsDir}`);
        sessions = []
        for (const directory of response2) {
            const sessionName = directory.filename;
            const response3 = await ssh.exec(`cat ${datasetDir}/${datasetId}/${trainedModelsDir}/${sessionName}/${metadataFile}`);
            sessions.push(JSON.parse(response3));
        }
        ssh.close(); // not executed if error
        res.json(sessions);
    } catch (e) {
        res.status(500);
        res.json(e);
        console.error(e);
    }
})

// Start training on SSH server
router.post('/:id/train/:dsId', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    const datasetId = req.params.dsId;
    const sessionName = req.body.sessionName;

    try {
        const cwd = `${datasetDir}/${datasetId}/${trainedModelsDir}/${sessionName}`

        const dav = DAVClient(auth.baseUrl + webdavPath, auth);
        const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));

        const ssh = new SSH2Promise(sshConfig);
        await ssh.exec(`mkdir -p ${cwd}`);

        const scp = await SCPClient(sshConfig);
        await scp.writeFile(`${cwd}/${metadataFile}`, JSON.stringify(req.body, null, 2));
        scp.close();

        // const response2 = await ssh.exec(`cd ${cwd}; tmux new-session -d -s ${sessionName} 'source ~/${scriptsDir}/venv/bin/activate; python3 ~/${scriptsDir}/diffusion.py maps';`);
        const response2 = await ssh.exec(`cd diffusion-lab; tmux new-session -d -s ${sessionName} 'source ~/${scriptsDir}/venv/bin/activate; python3 ~/${scriptsDir}/diffusion.py maps';`);
        ssh.close();

        res.json(response2);
    } catch (e) {
        res.status(500);
        res.json(e);
        console.error(e);
    }
});

// Stop training on SSH server
router.delete('/:id/train/:sessionName', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    const sessionName = req.params.sessionName;

    try {
        const response1 = await getFileContent(auth.baseUrl + webdavPath + serverDir + id + '/' + metadataFile, auth.username, auth.password);
        const sshConfig = toSSHConfig(response1.data);
        const ssh = new SSH2Promise(sshConfig);
        const response2 = await ssh.exec(`tmux kill-session -t ${sessionName}`);
        ssh.close();
        res.json(response2);
    } catch (e) {
        res.status(500);
        res.json(e);
        console.error(e);
    }
});

module.exports = router;