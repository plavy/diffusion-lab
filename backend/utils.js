const axios = require('axios');

exports.getAuth = function getAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    res.status(401);
    res.send("Basic Authentaction with URL is required.");
    return;
  }
  const auth = new Buffer.from(authHeader.split(' ')[1],
    'base64').toString().split(':');

  const baseUrl = 'https://' + auth[0];
  const username = auth[1];
  const password = auth[2];

  return { baseUrl: baseUrl, username: username, password: password };
}

exports.toSSHConfig = function toSSHConfig(metadata) {
  return {
    host: metadata.hostname,
    port: metadata.port,
    username: metadata.username,
    // privateKey: require('fs').readFileSync('/home/plavy/.ssh/id_rsa')
    privateKey: require('fs').readFileSync(process.env.SSH_PRIVATE_KEY_PATH || '/Users/tinplavec/.ssh/id_ed25519')
  };

}

exports.ensureVariable = function (variableName, variableValue) {
  if (!variableValue) {
    throw new Error(`${variableName} is not set!`)
  }
  return variableValue;
}

exports.parseCsv = function (csvData) {
  const lines = csvData.trim().split('\r\n');
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
  return columns;
}