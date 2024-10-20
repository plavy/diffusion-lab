const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const getAuth = require('../utils').getAuth;
const listDirectory = require('../utils').listDirectory;
const getFileContent = require('../utils').getFileContent;
const path = require('path');

const datasetDir = 'diffusion-lab/datasets/';
const webdavPath = '/remote.php/webdav/'
const metadataFile = 'metadata.json'

router.get('/', async (req, res) => {

    const auth = getAuth(req, res);
    if (!auth)
        return;

    const parser = new xml2js.Parser();

    try {
        const response = await listDirectory(auth.baseUrl + webdavPath + datasetDir, auth.username, auth.password);
        // Parse the XML response to a JS object
        const parsedData = await parser.parseStringPromise(response.data);
        // Extract file and directory names from the response
        const files = parsedData['d:multistatus']['d:response'].map(item => {
            return item['d:href'][0]; // Extract file/directory path
        });

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

module.exports = router;