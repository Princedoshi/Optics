const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackControllers");

// Submit Feedback
router.post("/", feedbackController.submitFeedback);

// Get Feedback for a Specific Branch
router.get("/branch/:branchId", feedbackController.getFeedbackByBranch);

// Get Feedback for a Specific FormData ID
router.get("/formData/:formDataId", feedbackController.getFeedbackByFormData);

module.exports = router;
