const express = require('express');
const router = express.Router();
const DAVClient = require('webdav').createClient;

const datasetDir = 'diffusion-lab/datasets/';
const trainedModelsDir = 'diffusion-lab/trained-models/';
const trainingDir = 'train/';
const validationDir = 'val/';
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
    console.error('Error for /datasets:', error.message);
    res.status(500);
    res.send(error.message);
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
    console.error('Error for /datasets/:id for', id, ':', error.message);
  }
});

// Get train images of a dataset
router.get('/:id/images/train', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
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
  const id = req.params.id;
  const name = req.params.name;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const readStream = dav.createReadStream(datasetDir + id + '/' + trainingDir + name)
    readStream.on('error', (error) => {
      res.status(error.status);
      res.send(error.message);
      console.error('Error for /datasets/:id/images/:name for', id, ':', error.message);
    })
    readStream.pipe(res);
  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.error('Error for /datasets/:id/images/:name for', id, ':', error.message);
  }
});

// List trained and training models of a dataset
router.get('/:id/models', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.getDirectoryContents(trainedModelsDir + id);

    const models = await Promise.all(
      response
        .filter(file => file.type == 'directory')
        .map(async file => {
          try {

            const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
            return metadata;
          } catch (error) {
            console.error('Error for /datasets/:id/models for', id, file.basename, error.message);
          }
        }));
    res.json(models.filter(model => model != null)); // Exclude models with errors
  } catch (error) {
    res.status(500);
    res.json(error);
    console.error('Error for /datasets/:id/models for', id, ':', error.message);
  }
});

// Get metrics of a trained model
router.get('/:id/models/:sessionName/metrics', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const response = await dav.getFileContents(trainedModelsDir + id + "/" + sessionName + "/lightning_logs/version_0/metrics.csv", { format: "text" });

    // Parse CSV to JSON
    const lines = response.trim().split('\r\n');
    const headers = lines[0].split(',');
    const columns = headers.reduce((acc, header) => {
      acc[header] = [];
      return acc;
    }, {});
    lines.slice(1).forEach((line) => {
      const values = line.split(',');
      values.forEach((value, index) => {
        columns[headers[index]].push(value);
      });
    });

    res.json(columns);
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /:id/models/:sessionName/metrics for', id, ':', error.message || error);
  }
});


// Delete a trained model of a dataset
router.delete('/:id/models/:sessionName', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth)
    const response = await dav.deleteFile(trainedModelsDir + id + '/' + sessionName);
    res.json({ code: 0 });
  } catch (error) {
    res.status(500);
    res.json({ code: 1 });
    console.error('Error for /datasets/:id/models/:sessionName for', id, sessionName, ':', error.message);
  }
});

module.exports = router;