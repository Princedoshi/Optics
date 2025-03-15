// routes/statisticsRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const { getBranchStatistics, getSalesmenStatistics,getBranchBusinessToday,getBranches } = require('../controllers/statistics-controller');

// Apply authentication middleware to all routes in this file
router.use(authenticate);

// Branch Statistics Route
router.get('/branches', getBranchStatistics);

// Salesmen Statistics Route
router.get('/salesmen', getSalesmenStatistics);

router.get("/today", getBranchBusinessToday);

router.get("/all", getBranches);



module.exports = router;