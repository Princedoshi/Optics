const express = require('express');
const { registerBranch, registerSalesman, login, registerAdmin } = require('../controllers/authControllers');
const isAdmin = require('../middlewares/adminMiddleware');
const router = express.Router();

router.post('/register-branch', isAdmin,registerBranch);
router.post('/register-salesman',isAdmin, registerSalesman);
router.post('/login', login);
router.post("/register/admin",isAdmin,registerAdmin)

module.exports = router;
