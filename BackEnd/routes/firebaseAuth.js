const express = require('express');
const router = express.Router();
const { firebaseLogin } = require('../controllers/firebaseAuth');

router.post('/auth/firebase', firebaseLogin);

module.exports = router;
