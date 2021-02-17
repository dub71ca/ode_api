const express = require('express');
const router = express.Router();

// import controller
const { getContributions, getContributionDetails } = require('../controllers/contribution');

router.get('/contributions', getContributions);
router.get('/contributions', getContributions);
router.get('/contribution-details/:id', getContributionDetails);

module.exports = router;