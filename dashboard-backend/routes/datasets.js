const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const { getStream } = require('../utils');
const getAuth = require('../utils').getAuth;
const listDirectory = require('../utils').listDirectory;
const DAVClient = require('webdav').createClient;

const datasetDir = 'diffusion-lab/datasets/';
const trainingDir = 'train/';
const validationDir = 'val/';
const metadataFile = 'metadata.json';


// List datasets
router.get('/', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    try {
        const dav = DAVClient(auth.baseUrl, auth)
        const response = await dav.getDirectoryContents(datasetDir);
        
        const datasets = await Promise.all(
            response
                .filter(file => file.type == 'directory')
                .map(async file => {
                    const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
                    return {
                        id: metadata.id,
                        name: metadata.name
                    }
                }))
        res.json(datasets);

    } catch (error) {
        console.error('Error for /datasets:', error.message);
        res.status(400);
        res.send(error.message);
    }
})

// Get metadata of a dataset
router.get('/:id', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {
        const dav = DAVClient(auth.baseUrl, auth)
        const metadata = JSON.parse(await dav.getFileContents(datasetDir + id + "/" + metadataFile, { format: "text" }));
        res.json(metadata);
    } catch (error) {
        console.error('Error for /datasets/:id for', id, ':', error.message);
    }
})

// Get train images of a dataset
router.get('/:id/images/train', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {
        const dav = DAVClient(auth.baseUrl, auth)
        const response = await dav.getDirectoryContents(datasetDir + id + '/' + trainingDir);
        
        const files = response
                .filter(file => file.type == 'file')
                .map(file => file.basename);
        res.json(files);

    } catch (error) {
        console.error('Error for /datasets/:id/images/train for', id, ':', error.message);
    }
})

// Get a specific train image of a dataset
router.get('/:id/images/train/:name', async (req, res) => {
    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    const name = req.params.name;
    try {
        // const dav = DAVClient(auth.baseUrl, auth)
        // const response = await dav.getFileContents(datasetDir + id + '/' + trainingDir + name, { format: "text" });

        const response = await getStream(auth.baseUrl + '/' + datasetDir + id + '/' + trainingDir + name, auth.username, auth.password);
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error('Error for /datasets/:id/images/:name for', id, ':', error.message);
    }
})

// List trained and training models of a dataset
router.get('/:id/models', async (req, res) => {
    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;

    // try {
    //     const dav = DAVClient(auth.baseUrl + webdavPath, auth);
    //     const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    //     const ssh = new SSH2Promise(sshConfig);

    //     const sftp = ssh.sftp();
    //     const response2 = await sftp.readdir(`${datasetDir}/${datasetId}/${trainedModelsDir}`);
    //     sessions = []
    //     for (const directory of response2) {
    //         const sessionName = directory.filename;
    //         const response3 = await ssh.exec(`cat ${datasetDir}/${datasetId}/${trainedModelsDir}/${sessionName}/${metadataFile}`);
    //         sessions.push(JSON.parse(response3));
    //     }
    //     ssh.close(); // not executed if error
    //     res.json(sessions);
    // } catch (e) {
    //     res.status(500);
    //     res.json(e);
    //     console.error(e);
    // }
})


module.exports = router;