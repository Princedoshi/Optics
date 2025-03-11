const express = require('express');
const { registerBranch, registerSalesman, login } = require('../controllers/authControllers');
const router = express.Router();

router.post('/register-branch', registerBranch);
router.post('/register-salesman', registerSalesman);
router.post('/login', login);

module.exports = router;
