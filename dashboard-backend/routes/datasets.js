const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const { getStream } = require('../utils');
const getAuth = require('../utils').getAuth;
const listDirectory = require('../utils').listDirectory;
const getFileContent = require('../utils').getFileContent;

const datasetDir = 'diffusion-lab/datasets/';
const trainingDir = 'train/';
const validationDir = 'val/';
const webdavPath = '/remote.php/webdav/';
const metadataFile = 'metadata.json';


router.get('/', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const parser = new xml2js.Parser();

    try {
        const response = await listDirectory(auth.baseUrl + webdavPath + datasetDir, auth.username, auth.password);
        // Parse the XML response to a JS object
        const parsedData = await parser.parseStringPromise(response.data);
        const files = parsedData['d:multistatus']['d:response']
            .map(item => item['d:href'][0])
            .filter(item => item != webdavPath + datasetDir);

        let datasets = [];
        for (const datasetPath of files) {

            try {
                const response = await getFileContent(auth.baseUrl + datasetPath + metadataFile, auth.username, auth.password);
                const metadata = response.data;
                datasets.push({
                    id: metadata.id,
                    name: metadata.name,
                });
            } catch (error) {
                console.error('Error retrieving file content:', error.message);
            }
        }
        res.json(datasets);

    } catch (error) {
        console.error('Error listing directory contents:', error.message);
        res.status(400);
        res.send(error.message);
    }

})

router.get('/:id', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {
        const response = await getFileContent(auth.baseUrl + webdavPath + datasetDir + id + '/' + metadataFile, auth.username, auth.password);
        const metadata = response.data;
        res.json({
            id: metadata.id,
            name: metadata.name,
            author: metadata.author
        });
    } catch (error) {
        console.error('Error retrieving file content:', error.message);
    }
})

router.get('/:id/images/train', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    try {
        const parser = new xml2js.Parser();
        const dirUrl = webdavPath + datasetDir + id + '/' + trainingDir
        const response1 = await listDirectory(auth.baseUrl + dirUrl, auth.username, auth.password);
        const parsedData = await parser.parseStringPromise(response1.data);
        const files = parsedData['d:multistatus']['d:response']
            .map(item => item['d:href'][0])
            .filter(item => item != dirUrl)
            .map(item => item.split('/').pop());
        res.json(files)

    } catch (error) {
        console.error('Error for /:id/images :', error.message);
    }
})

router.get('/:id/images/train/:name', async (req, res) => {
    const auth = getAuth(req, res);
    if (!auth)
        return;

    const id = req.params.id;
    const name = req.params.name;
    try {
        const response = await getStream(auth.baseUrl + webdavPath + datasetDir + id + '/' + trainingDir + name, auth.username, auth.password);
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error('Error for /:id/images/:name :', error.message);
    }
})

module.exports = router;