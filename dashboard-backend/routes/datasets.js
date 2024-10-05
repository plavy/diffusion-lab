const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(["maps", "buildings", "lamps"]));
});

module.exports = router;