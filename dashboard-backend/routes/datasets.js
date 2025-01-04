const express = require('express');
const router = express.Router();
const { getStream } = require('../utils');
const getAuth = require('../utils').getAuth;
const DAVClient = require('webdav').createClient;

const datasetDir = 'diffusion-lab/datasets/';
const trainedModelsDir = 'diffusion-lab/trained-models/';
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
});

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
});

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
});

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
});

// List trained and training models of a dataset
router.get('/:id/models', async (req, res) => {
    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;

    try {
        const dav = DAVClient(auth.baseUrl, auth)
        const response = await dav.getDirectoryContents(trainedModelsDir + id);

        const models = await Promise.all(
            response
                .filter(file => file.type == 'directory')
                .map(async file => {
                    const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
                    return metadata;
                }))
        res.json(models);
    } catch (error) {
        res.status(500);
        res.json(error);
        console.error('Error for /datasets/:id/models for', id, ':', error.message);
    }
});

// Delete a trained model of a dataset
router.delete('/:id/models/:sessionName', async (req, res) => {
    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    const sessionName = req.params.sessionName;

    try {
        const dav = DAVClient(auth.baseUrl, auth)
        const response = await dav.deleteFile(trainedModelsDir + id + '/' + sessionName);
        res.json({ code: 0 });
    } catch (error) {
        res.status(500);
        res.json({ code: 1 });
        console.error('Error for /datasets/:id/models/:sessionName for', id, sessionName, ':', error.message);
    }

});

module.exports = router;