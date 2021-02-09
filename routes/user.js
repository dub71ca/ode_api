const express = require('express');
const router = express.Router();

// import controller
const { requireSignIn, adminMiddleware } = require('../controllers/auth');
const { read, update } = require('../controllers/user');
const { getRegisteredContributions, insertContribution, updateContribution, deleteContribution } = require('../controllers/contribution');

router.get('/user/:id', requireSignIn, read);
router.put('/user/update', requireSignIn, update);
router.put('/admin/update', requireSignIn, adminMiddleware, update);  // this is good example of ability to have role based access
router.get('/my-contributions/:id', getRegisteredContributions);
router.post('/add-contribution', insertContribution)
router.put('/edit-contribution', updateContribution)
router.put('/delete-contribution/:id', deleteContribution)


module.exports = router;