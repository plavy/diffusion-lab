const express = require('express');
const router = express.Router();
const DAVClient = require('webdav').createClient;

const augmentationDir = 'diffusion-lab/scripts/augmentations';
const metadataFile = 'metadata.json';

// List augmentations
router.get('/', async (req, res) => {
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.getDirectoryContents(augmentationDir);

    const augmentations = await Promise.all(
      response
        .filter(file => file.type == 'directory')
        .map(async file => {
          const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
          return metadata;
        }))
    res.json(augmentations);

  } catch (error) {
    console.error('Error for /augmentations:', error.message);
    res.status(500);
    res.send(error.message);
  }
});

module.exports = router;