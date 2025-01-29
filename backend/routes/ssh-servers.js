const express = require('express');
const router = express.Router();

const DAVClient = require('webdav').createClient;
const pLimit = require('p-limit');

const SSH2Promise = require('ssh2-promise');
const SCPClient = require('node-scp').Client;
const { toSSHConfig, ensureVariable, parseCsv } = require('../utils');

const serverDir = 'diffusion-lab/ssh-servers/';
const metadataFile = 'metadata.json';
const scriptsDir = 'diffusion-lab/scripts/';
const datasetDir = 'diffusion-lab/datasets/';
const sessionDir = 'diffusion-lab/sessions/';
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
    res.status(500).send(error.message || error);
    console.error('Error for GET /servers', ':', error.message || error);
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
    res.status(500).send(error.message || error);
    console.error('Error for POST /servers', ':', error.message || error);
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
    res.status(500).send(error.message || error);
    console.error('Error for GET /servers/:id for', id, ':', error.message || error);
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
    res.status(500).send(error.message || error);
    console.error('Error for PUT /servers/:id for', id, ':', error.message || error);
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
    res.status(500).send(error.message || error);
    console.error('Error for DELETE /servers/:id for', id, ':', error.message || error);
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
    res.status(500).json({ code: 1, message: "Interal server error" });
    console.error('Error for /servers/:id/status for', id, ':', error.message);
  }
});

// Sync files from DAV server to SSH server
router.post('/:id/sync', async (req, res) => {
  const id = req.params.id;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);

    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);
    const scp = await SCPClient(sshConfig);

    // Datasets
    const storage_list = await dav.getDirectoryContents(datasetDir, { deep: true });
    const storage_dirs = storage_list.filter(file => file.type == 'directory').map(file => file.filename.replace(/^\/+/, ''));
    const storage_files = storage_list.filter(file => file.type == 'file').map(file => file.filename.replace(/^\/+/, ''));
    const server_dirs = (await ssh.exec(`find ${datasetDir} -mindepth 1 -type d`)).trim().split('\n');
    const server_files = (await ssh.exec(`find ${datasetDir} -type f`)).trim().split('\n');

    const files_to_delete = server_files.filter(el => !storage_files.includes(el));
    const dirs_to_delete = server_dirs.filter(el => !storage_dirs.includes(el));
    const dirs_to_create = storage_dirs.filter(el => !server_dirs.includes(el));
    const files_to_create = storage_files.filter(el => !server_files.includes(el));

    console.time('syncDatasets');
    if (files_to_delete.length > 0) {
      // Slice large array to avoid bash command too long
      const chunk_size = 100
      const chunks = [];
      for (let i = 0; i < files_to_delete.length; i += chunk_size) {
        chunks.push(files_to_delete.slice(i, i + chunk_size));
      }
      console.time('rmFiles');
      for (const chunk of chunks) {
        await ssh.exec(`rm ${chunk.map(file => `"${file}"`).join(' ')}`);
      }
      console.timeEnd('rmFiles');
    }
    if (dirs_to_delete.length > 0) {
      console.time('rmDirs');
      for (const dir of dirs_to_delete.reverse()) {
        await ssh.exec(`rmdir ${dir}`);
      }
      console.timeEnd('rmDirs');
    }
    if (dirs_to_create.length > 0) {
      console.time('createDirs');
      for (const dir of dirs_to_create) {
        await ssh.exec(`mkdir -p ${dir}`);
      }
      console.timeEnd('createDirs');
    }

    const concurrencyLimit = pLimit(32);
    if (files_to_create.length > 0) {
      console.time('createFiles');
      const create_files = files_to_create.map(async file => concurrencyLimit(async () => {
        const file_content = await dav.getFileContents(file);
        await scp.writeFile(file, file_content);
      }));
      await Promise.all(create_files);
      console.timeEnd('createFiles');
    }
    console.timeEnd('syncDatasets');

    // Scripts
    const scripts_list = await dav.getDirectoryContents(scriptsDir, { deep: true });
    const dirs = scripts_list.filter(file => file.type == 'directory').map(file => file.filename.replace(/^\/+/, ''));
    const files = scripts_list.filter(file => file.type == 'file').map(file => file.filename.replace(/^\/+/, ''));
    // Remove old scripts, if exist, except venv
    await ssh.exec(`if [[ -d ${scriptsDir} ]]; then find ${scriptsDir} -mindepth 1 -maxdepth 1 ! -name 'venv' -exec rm -r {} +; fi`);
    await ssh.exec(`mkdir -p ${dirs.map(dir => `"${dir}"`).join(' ')}`);
    // Create scripts files
    console.time('syncScripts');
    const create_scripts_files = files.map(async file => concurrencyLimit(async () => {
      const file_content = await dav.getFileContents(file);
      await scp.writeFile(file, file_content);
    }));
    await Promise.all(create_scripts_files);
    console.timeEnd('syncScripts');

    scp.close();

    console.time('runSetup');
    await ssh.exec(`cd ${scriptsDir}; bash ~/${scriptsDir}/setup.sh;`);
    console.timeEnd('runSetup');
    res.json({ code: 0 });
    ssh.close();
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /servers/:id/sync for', id, ':', error.message || error);
  }
});

// Clear cache
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
    res.status(500).send(error.message || error);
    console.error('Error for /servers/:id/cache for', id, ':', error.message || error);
  }
});

// Start training on SSH server
router.post('/:id/train', async (req, res) => {
  const id = req.params.id;
  try {
    const datasetId = ensureVariable("Dataset", req.body.dataset);
    const sessionName = ensureVariable("Session name", req.body.sessionName);
    const cwd = `${sessionDir}/${datasetId}/${sessionName}`

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));

    const ssh = new SSH2Promise(sshConfig);
    await ssh.exec(`mkdir -p ${cwd}`);

    const scp = await SCPClient(sshConfig);
    await scp.writeFile(`${cwd}/${metadataFile}`, JSON.stringify(req.body, null, 2));
    scp.close();

    const command = `
    echo "source ~/${scriptsDir}/venv/bin/activate && \
    python3 ~/${scriptsDir}/train.py \
    --dav-url '${req.auth.baseUrl}' \
    --dav-username '${req.auth.username}' \
    --dav-password '${req.auth.password}' \
    --dataset-dir '${datasetDir}/${datasetId}' \
    --training-dir '${cwd}' \
    --metadata-file '${cwd}/${metadataFile}' \
    " >> tmp.sh;
    
    tmux new-session -d -s ${sessionName} " \
    bash tmp.sh;
    sleep 300";`;
    // qsub -N diffusion-lab -l select=1:ngpus=1 tmp.sh;
    console.log(command)
    const response2 = await ssh.exec(command);
    ssh.close();

    res.json(response2);
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /servers/:id/train for', id, ':', error.message || error);
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
    res.status(500).send(error.message || error);
    console.error('Error for /servers/:id/train/:sessionName for', id, ':', error.message || error);
  }
});

// Get training logs
router.get('/:id/train/:sessionName/logs', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);

    await ssh.exec(`tmux pipe-pane -t ${sessionName} "cat > tmux-output"`);
    const response = await ssh.exec('cat tmux-output; rm tmux-output');
    ssh.close();
    res.send(response);
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /servers/:id/train/:sessionName/logs for', id, ':', error.message || error);
  }
});

// Get training metrics
router.get('/:id/train/:sessionName/metrics', async (req, res) => {
  const id = req.params.id;
  const sessionName = req.params.sessionName;
  try {
    const datasetId = ensureVariable("Dataset", req.query.dataset);
    const cwd = `${sessionDir}/${datasetId}/${sessionName}`

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);

    const response = await ssh.exec(`cat ${cwd}/lightning_logs/version_0/metrics.csv`);
    ssh.close();
    res.json(parseCsv(response));
  } catch (error) {
    res.status(500).send(error.message || error);
    console.error('Error for /servers/:id/train/:sessionName/metrics for', id, ':', error.message || error);
  }
});



// Generate images
router.post('/:id/generate/:name', async (req, res) => {
  const id = req.params.id;
  const baseName = req.params.name;
  try {
    const datasetId = ensureVariable("Dataset", req.body.datasetId);
    const session = ensureVariable("Session", req.body.session);

    const dav = DAVClient(req.auth.baseUrl, req.auth);
    const sshConfig = toSSHConfig(JSON.parse(await dav.getFileContents(serverDir + id + '/' + metadataFile, { format: 'text' })));
    const ssh = new SSH2Promise(sshConfig);

    const cwd = `${sessionDir}/${datasetId}/${session}`
    const command = `cd ${cwd}; source ~/${scriptsDir}/venv/bin/activate; python3 ~/${scriptsDir}/sample.py \
        --save-dir ${samplesDir} \
        --base-name ${baseName} \
        --number '${req.body.numberImages}' \
        `;
    console.log(command)
    await ssh.exec(command);
    ssh.close();

    res.json({ code: 0 });
  } catch (error) {
    res.status(500).send(error.message || error);
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
    res.status(500).send(error.message || error);
    console.error('Error for /servers/:id/generate/:name/image/:number for', id, ':', error.message || error);
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
      res.status(500).send(error.message || error);
      console.error('Error for /servers/:id/generate/:name/progress for', id, ':', error.message || error);
    }
  }
});

module.exports = router;