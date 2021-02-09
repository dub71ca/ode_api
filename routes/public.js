const express = require('express');
const router = express.Router();

// import controller
const { getContributions } = require('../controllers/contribution');

router.get('/contributions', getContributions);

module.exports = router;