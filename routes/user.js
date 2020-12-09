const express = require('express');
const router = express.Router();

// import controller
const { read } = require('../controllers/user');
const { requireSignIn } = require('../controllers/auth');

router.get('/user/:id', read);

module.exports = router;