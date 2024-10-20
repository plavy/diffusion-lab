const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');

router.get('/', (req, res) => {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic');
        res.status(401);
        res.send("Basic Authentaction with URL is required.");
        return;
    }

    const auth = new Buffer.from(authHeader.split(' ')[1],
        'base64').toString().split(':');

    const nextcloudUrl = 'https://' + auth[0];
    const username = auth[1];
    const password = auth[2];

    const parser = new xml2js.Parser();

    async function listDirectory() {
        try {
            // PROPFIND request to list directory contents
            const response = await axios({
                method: 'PROPFIND',
                url: nextcloudUrl + '/remote.php/webdav/diffusion-lab/datasets/', // With trailing slash
                auth: {
                    username: username,
                    password: password,
                },
                headers: {
                    Depth: 1,
                },
            });

            // Parse the XML response to a JS object
            const parsedData = await parser.parseStringPromise(response.data);

            // Extract file and directory names from the response
            const files = parsedData['d:multistatus']['d:response'].map(item => {
                return item['d:href'][0]; // Extract file/directory path
            });

            let datasets = [];
            for (filePath of files) {

                async function getFileContent() {
                    try {
                        // Perform GET request with basic auth to read file content
                        const response = await axios({
                            method: 'get',
                            url: nextcloudUrl + filePath + 'metadata.json',
                            auth: {
                                username: username,
                                password: password,
                            },
                        });

                        const metadata = response.data;
                        console.log(metadata);
                        datasets.push({
                            id: metadata.id,
                            name: metadata.name,
                        });


                    } catch (error) {
                        console.error('Error retrieving file content:', error.message);
                    }
                }

                // Call the function to get file content
                await getFileContent();
            }

            console.log(datasets)
            res.json(datasets);

        } catch (error) {
            console.error('Error listing directory contents:', error.message);
            res.status(400);
            res.send(error.message);
        }
    }

    listDirectory();

})

module.exports = router;