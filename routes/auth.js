const express = require('express');
const router = express.Router();

// import controller
const { signup, accountActivation } = require('../controllers/auth');

// import validators
const { userSignUpValidator } = require('../validators/auth');
const { runValidation } = require('../validators');

router.post('/signup', userSignUpValidator, runValidation, signup);
router.post('/account-activation', accountActivation);

module.exports = router;