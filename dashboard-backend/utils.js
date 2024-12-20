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

exports.getFileContent = async function getFileContent(url, username, password) {
    // GET request to read file content
    const response = await axios({
        method: 'get',
        url: url,
        auth: {
            username: username,
            password: password,
        },
    });
    return response;
}

exports.getStream = async function getStream(url, username, password) {
    // GET request to read file content
    const response = await axios({
        method: 'get',
        responseType: 'stream',
        url: url,
        auth: {
            username: username,
            password: password,
        },
    });
    return response;
}

exports.listDirectory = async function listDirectory(url, username, password) {
    // PROPFIND request to list directory contents
    const response = await axios({
        method: 'PROPFIND',
        url: url,
        auth: {
            username: username,
            password: password,
        },
        headers: {
            Depth: 1,
        },
    });
    return response;
}

exports.toSSHConfig = function toSSHConfig(metadata) {
    return {
        host: metadata.hostname,
        port: metadata.port,
        username: metadata.username,
        // privateKey: require('fs').readFileSync('/home/plavy/.ssh/id_rsa')
        privateKey: require('fs').readFileSync('/Users/tinplavec/.ssh/id_ed25519')
    };

}