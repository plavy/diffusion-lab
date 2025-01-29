const express = require('express');
const { parseCsv } = require('../utils');
const router = express.Router();
const DAVClient = require('webdav').createClient;

const datasetDir = 'diffusion-lab/datasets/';
const sessionDir = 'diffusion-lab/sessions/';
const dataDir = 'data/';
const metadataFile = 'metadata.json';


// List datasets
router.get('/', async (req, res) => {
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.getDirectoryContents(datasetDir);

    const datasets = await Promise.all(
      response
        .filter(file => file.type == 'directory')
        .map(async file => {
          const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
          return metadata;
        }))
    res.json(datasets);

  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /datasets:', error.message || error);
  }
});

// Get metadata of a dataset
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const metadata = JSON.parse(await dav.getFileContents(datasetDir + id + "/" + metadataFile, { format: "text" }));
    res.json(metadata);
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /datasets/:id for', id, ':', error.message || error);
  }
});

// Get preview of images of a dataset
router.get('/:id/images', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.getDirectoryContents(datasetDir + id + '/' + dataDir);

    const files = response
      .filter(file => file.type == 'file')
      .map(file => file.basename);
    res.json(files);

  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /datasets/:id/images for', id, ':', error.message || error);
  }
});

// Get a specific train image of a dataset
router.get('/:id/images/:name', async (req, res) => {
  const id = req.params.id;
  const name = req.params.name;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const readStream = dav.createReadStream(datasetDir + id + '/' + dataDir + name)
    readStream.on('error', (error) => {
      res.status(500).send(error.message || error);
      console.error('Error for /datasets/:id/images/:name for', id, ':', error.message || error);
    })
    readStream.pipe(res);
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /datasets/:id/images/:name for', id, ':', error.message || error);
  }
});

// List trainings of a dataset
router.get('/:id/sessions', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.getDirectoryContents(sessionDir + id);

    const sessions = await Promise.all(
      response
        .filter(file => file.type == 'directory')
        .map(async file => {
          try {
            const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
            return metadata;
          } catch (error) {
            console.error('Error for /datasets/:id/sessions for', id, file.basename, error.message);
          }
        }));
    res.json(sessions.filter(session => session != null)); // Exclude empty sessions
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /datasets/:id/sessions for', id, ':', error.message || error);
  }
});

// Get metrics of a session
router.get('/:id/sessions/:sessionName/metrics', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const response = await dav.getFileContents(sessionDir + id + "/" + sessionName + "/lightning_logs/version_0/metrics.csv", { format: "text" });
    res.json(parseCsv(response));
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /:id/sessions/:sessionName/metrics for', id, ':', error.message || error);
  }
});

// Delete a session of a dataset
router.delete('/:id/sessions/:sessionName', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const _ = await dav.deleteFile(sessionDir + id + '/' + sessionName);
    res.json({ code: 0 });
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /datasets/:id/sessions/:sessionName for', id, sessionName, ':', error.message || error);
  }
});

module.exports = router;