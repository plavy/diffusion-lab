const express = require('express');
const router = express.Router();
const DAVClient = require('webdav').createClient;

const downsizingDir = 'diffusion-lab/scripts/downsizings';
const metadataFile = 'metadata.json';

// List downsizings
router.get('/', async (req, res) => {
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.getDirectoryContents(downsizingDir);

    const downsizings = await Promise.all(
      response
        .filter(file => file.type == 'directory')
        .map(async file => {
          const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
          return metadata;
        }))
    res.json(downsizings);

  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /downsizings:', error.message || error);
  }
});

module.exports = router;