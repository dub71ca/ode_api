const express = require('express');
const router = express.Router();

// import controller
const { getContributors } = require('../controllers/contributor');

router.get('/contributors', getContributors);

module.exports = router;