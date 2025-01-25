const express = require('express');
const router = express.Router();
const DAVClient = require('webdav').createClient;

const modelsDir = 'diffusion-lab/scripts/models';
const metadataFile = 'metadata.json';

// List models
router.get('/', async (req, res) => {
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.getDirectoryContents(modelsDir);

    const models = await Promise.all(
      response
        .filter(file => file.type == 'directory')
        .map(async file => {
          const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
          return metadata;
        }))
    res.json(models);

  } catch (error) {
    console.error('Error for /models:', error.message);
    res.status(500);
    res.send(error.message);
  }
});

module.exports = router;