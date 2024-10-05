const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json([
        {
            name: "Maps",
            id: 1
        },
        {
            name: "Buildings",
            id: 2
        },
        {
            name: "Lamps",
            id: 3
        }
    ]);
});

module.exports = router;