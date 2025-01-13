const express = require('express');
const router = express.Router();

const DAVClient = require('webdav').createClient;
const pLimit = require('p-limit');

const SSH2Promise = require('ssh2-promise');
const SCPClient = require('node-scp').Client;
const { toSSHConfig, ensureVariable } = require('../utils');

const serverDir = 'diffusion-lab/ssh-servers/';
const metadataFile = 'metadata.json';
const scriptsDir = 'diffusion-lab/scripts/';
const datasetDir = 'diffusion-lab/datasets/';
const trainedModelsDir = 'diffusion-lab/trained-models/';
const samplesDir = '/tmp/samples';

// List SSH servers
router.get('/', async (req, res) => {
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const response = await dav.getDirectoryContents(serverDir);
    const servers = await Promise.all(
      response
        .filter(file => file.type == 'directory')
        .map(async file => {
          const metadata = JSON.parse(await dav.getFileContents(file.filename + "/" + metadataFile, { format: "text" }));
          return metadata;
        }))
    res.json(servers);

  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.error('Error for GET /servers', ':', error.message);
  }

});

// Add config of new SSH server
router.post('/', async (req, res) => {
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const metadata = req.body;
    const id = metadata.name
      .replace(/[A-Z]/g, char => char.toLowerCase())
      .replace(/[^a-z0-9]/g, '-');
    metadata['id'] = id;
    await dav.createDirectory(serverDir + id);
    await dav.putFileContents(serverDir + id + "/" + metadataFile, JSON.stringify(metadata, null, 2));
    res.json({ 'id': id });
  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.error('Error for POST /servers', ':', error.message);
  }
});

// Get config of SSH server
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const metadata = JSON.parse(await dav.getFileContents(serverDir + id + "/" + metadataFile, { format: "text" }));
    res.json(metadata);
  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.error('Error for GET /servers/:id for', id, ':', error.message);
  }

});

// Update config of SSH server
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const newMetadata = JSON.stringify(req.body, null, 2);
    await dav.putFileContents(serverDir + id + "/" + metadataFile, newMetadata);
    res.json({ 'code': 0 });
  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.error('Error for PUT /servers/:id for', id, ':', error.message);
  }
});

// Remove config of SSH server
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    await dav.deleteFile(serverDir + id);
    res.json({ 'code': 0 });
  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.error('Error for DELETE /servers/:id for', id, ':', error.message);
  }
});

// Get status of SSH server
router.get('/:id/status', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const metadata = JSON.parse(await dav.getFileContents(serverDir + id + "/" + metadataFile, { format: "text" }));
    const ssh = new SSH2Promise({ ...toSSHConfig(metadata), readyTimeout: 4000, reconnect: false });
    try {
      await ssh.connect();
      res.json({ code: 0, message: "Server reachable" });
    } catch (e) {
      if (e.level == "client-authentication")
        res.json({ code: 1, message: "Authentication failed" });
      else
        res.json({ code: 1, message: "Server unreachable" });
      // console.log(e);
    } finally {
      ssh.close();
    }

  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.error('Error for /servers/:id/status for', id, ':', error.message);
  }
});

// Sync files from DAV server to SSH server
router.post('/:id/sync', async (req, res) => {
  const id = req.params.id;
  try {

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const response1 = await dav.getDirectoryContents(scriptsDir, { deep: true });
    const dirs = response1.filter(file => file.type == 'directory');
    const files = response1.filter(file => file.type == 'file');

    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);

    try {
      // Remove old files, if exist, except venv
      await ssh.exec(`if [[ -d ${scriptsDir} ]]; then find ${scriptsDir} -mindepth 1 -maxdepth 1 ! -name 'venv' -exec rm -r {} +; fi`);
      // Create directories
      for (const dir of dirs) {
        await ssh.exec(`mkdir -p ${dir.filename.replace(/^\/+/, '')}`);
      }
      // Create files
      const scp = await SCPClient(sshConfig);
      console.time('syncServer');
      const concurrencyLimit = pLimit(10);
      const tasks = files.map(async file => concurrencyLimit(async () => {
        const response2 = await dav.getFileContents(file.filename);
        await scp.writeFile(file.filename.replace(/^\/+/, ''), response2); // Remove slash from beginning
      }));
      await Promise.all(tasks);
      console.timeEnd('syncServer');
      scp.close();
    } catch (error) {
      console.error('Error for /servers/:id/sync for', id, ':', error);
    }

    console.time('runSetup');
    await ssh.exec(`cd ${scriptsDir}; bash ~/${scriptsDir}/setup.sh;`);
    console.timeEnd('runSetup');
    res.json({ code: 0 });
    ssh.close();
  } catch (error) {
    res.status(500).json({ code: 1 });
    console.error('Error for /servers/:id/sync for', id, ':', error.message);
  }
});

router.delete('/:id/cache', async (req, res) => {
  const id = req.params.id;
  try {

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);
    // Remove directories
    await ssh.exec(`if [[ -d ${samplesDir} ]]; then rm -r ${samplesDir}; fi`);
    res.json({ code: 0 });
    ssh.close();
  } catch (error) {
    res.status(500).json({ code: 1 });
    console.error('Error for /servers/:id/cache for', id, ':', error.message);
  }
});

// Start training on SSH server
router.post('/:id/train', async (req, res) => {
  const id = req.params.id;
  try {
    const datasetId = ensureVariable("Dataset", req.body.dataset);
    const sessionName = ensureVariable("Session name", req.body.sessionName);
    const cwd = `${trainedModelsDir}/${datasetId}/${sessionName}`

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));

    const ssh = new SSH2Promise(sshConfig);
    await ssh.exec(`mkdir -p ${cwd}`);

    const scp = await SCPClient(sshConfig);
    await scp.writeFile(`${cwd}/${metadataFile}`, JSON.stringify(req.body, null, 2));
    scp.close();

    const command = `tmux new-session -d -s ${sessionName} "source ~/${scriptsDir}/venv/bin/activate; python3 ~/${scriptsDir}/train.py \
            --dav-url '${req.auth.baseUrl}' \
            --dav-username '${req.auth.username}' \
            --dav-password '${req.auth.password}' \
            --dataset-dir '${datasetDir}/${datasetId}' \
            --training-dir '${cwd}' \
            --metadata-file '${cwd}/${metadataFile}' \
            ; sleep 60";`;
    const response2 = await ssh.exec(command);
    ssh.close();

    res.json(response2);
  } catch (error) {
    res.status(400).send(error.message);
    console.error('Error for /servers/:id/train for', id, ':', error.message);
  }
});

// Stop training on SSH server
router.delete('/:id/train/:sessionName', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);
    const response2 = await ssh.exec(`tmux kill-session -t ${sessionName}`);
    ssh.close();
    res.json(response2);
  } catch (error) {
    res.status(500);
    res.json(error);
    console.error('Error for /servers/:id/train/:sessionName for', id, ':', error.message);
  }
});

// Get training logs
router.get('/:id/train/:sessionName/logs', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    console.log('trying logging');

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);

    await ssh.exec(`tmux pipe-pane -t ${sessionName} "cat > tmux-output"`);
    const response = await ssh.exec('cat tmux-output; rm tmux-output');
    ssh.close();
    res.send(response);
  } catch (error) {
    res.status(500).send(error);
    console.error('Error for /servers/:id/train/:sessionName/logs for', id, ':', error);
  }

});

// Generate images
router.post('/:id/generate/:name', async (req, res) => {
  const id = req.params.id;
  const baseName = req.params.name;
  try {
    const datasetId = ensureVariable("Dataset", req.body.datasetId);
    const trainedModel = ensureVariable("Trained model", req.body.trainedModel);

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);

    const cwd = `${trainedModelsDir}/${datasetId}/${trainedModel}`
    const command = `cd ${cwd}; source ~/${scriptsDir}/venv/bin/activate; python3 ~/${scriptsDir}/sample.py \
        --save-dir ${samplesDir} \
        --base-name ${baseName} \
        --number '${req.body.numberImages}' \
        `;
    await ssh.exec(command);
    ssh.close();

    res.json({ code: 0 });
  } catch (error) {
    res.status(400).send(error.message || error);
    console.error('Error for /servers/:id/generate/:name for', id, ':', error.message || error);
  }
});

// Get generated image
router.get('/:id/generate/:name/image/:number', async (req, res) => {
  const id = req.params.id;
  const baseName = req.params.name;
  const number = req.params.number;

  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));

    const scp = await SCPClient(sshConfig);
    const file = await scp.readFile(`${samplesDir}/${baseName}-${number}.jpg`);
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(file);
    scp.close();
  } catch (error) {
    res.status(500);
    res.json(error);
    console.error('Error for /servers/:id/generate/:name/image/:number for', id, ':', error.message);
  }
});

// Get generation progress
router.get('/:id/generate/:name/progress', async (req, res) => {
  const id = req.params.id;
  const name = req.params.name;

  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));

    const scp = await SCPClient(sshConfig);
    const file = await scp.readFile(`${samplesDir}/${name}-progress.txt`);
    res.send(file);
    scp.close();
  } catch (error) {
    if (error.code == 2) {
      res.send("0");
    } else {
      res.status(500);
      res.json(error);
      console.error('Error for /servers/:id/generate/:name/progress for', id, ':', error.message);
    }
  }
});

module.exports = router;