const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');

router.get('/', (req, res) => {
    res.json([
        {
            name: "Maps",
            id: 1
        },
        {
            name: "Buildings",
            id: 2
        },
        {
            name: "Lamps",
            id: 3
        }
    ]);
});

router.get('/cloud', (req, res) => {

    // Nextcloud credentials
    const username = 'diffusion-lab';
    const password = 'x4ykBPQc(v2Je#S7_u';

    // The directory you want to list (relative to your Nextcloud root)
    const directoryPath = 'diffusion-lab/datasets'; // Note trailing slash

    // The Nextcloud base URL
    const nextcloudUrl = 'https://nextcloud.napoleon.plavy.me' + '/remote.php/webdav/' + directoryPath;

    // Set up the XML parser
    const parser = new xml2js.Parser();

    async function listDirectory() {
        try {
            // Perform PROPFIND request to list directory contents
            const response = await axios({
                method: 'PROPFIND',
                url: nextcloudUrl,
                auth: {
                    username: username,
                    password: password,
                },
                headers: {
                    Depth: 1, // Depth 1 means we get the immediate children
                },
            });

            // Parse the XML response to a JS object
            const parsedData = await parser.parseStringPromise(response.data);

            // Extract file and directory names from the response
            const files = parsedData['d:multistatus']['d:response'].map(item => {
                return item['d:href'][0]; // Extract file/directory path
            });

            // Log the list of files and directories
            console.log('Files and directories in the specified folder:');
            files.forEach(file => console.log(file));
            res.json(files);

        } catch (error) {
            console.error('Error listing directory contents:', error);
        }
    }

    // Call the listDirectory function
    listDirectory();

})

module.exports = router;