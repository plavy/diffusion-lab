const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json([
        {
            name: "ZEMRIS",
            id: 1
        },
    ]);
});

module.exports = router;