const express = require("express");
const authenticate = require("../middlewares/authMiddleware");

const {
  createFormData,
  getAllFormData,
  getFormDataByBillNo,
  getPendingPayments,
  updatePendingStatus,
  getPendingPaymentByBillNo,
  updateFormData, // Import the new function
  deleteFormData  // Import the delete function
} = require("../controllers/optics-controllers");

const {
  getMonthlyCustomerData,
  getMonthlyRevenueData,
  getTopFrames,
  getCustomerDataByYear,
  getNewCustomers
} = require("../controllers/customer-analytics-controllers");

const { getMonthlyRevenueDataByYear } = require("../controllers/revenue-analytics-controllers");

const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePaymentStatus,
  makePartialPayment
} = require("../controllers/purchase-controllers");

const { getMonthlyPurchaseDistribution } = require("../controllers/purchase-analytics");

const { getSalesSummary } = require("../controllers/order-analytics-controllers");

const router = express.Router();

// ✅ Apply the middleware globally
router.use(authenticate);

// Form Data Routes
router.post("/add-form", createFormData);
router.get("/get-data", getAllFormData);
router.get("/get-data/:billNo", getFormDataByBillNo);
router.put("/update-form/:id", updateFormData); // Add the update route

// Customer Analytics Routes
router.get("/customers/monthly", getMonthlyCustomerData);
router.get("/customers/monthly/:year", getCustomerDataByYear);
router.get("/customers/orders", getTopFrames);
router.get("/customers/unique", getNewCustomers);

// Revenue Analytics Routes
router.get("/revenue/monthly", getMonthlyRevenueData);
router.get("/revenue/monthly/:year", getMonthlyRevenueDataByYear);

// Purchase History Routes
router.post("/add-purchase", createPurchase);
router.get("/get-purchases", getAllPurchases);
router.get("/get-purchase/:id", getPurchaseById);
router.put("/update-paymentStatus/:id", updatePaymentStatus);
router.patch("/partial-payments/:id", makePartialPayment);

// Purchase Analytics Routes
router.get("/purchases/monthly", getMonthlyPurchaseDistribution);

// Pending Payments
router.get("/pending-payments", getPendingPayments);
router.put("/update-pending-status/:billNo", updatePendingStatus);
router.get("/pending-payments/:billNo", getPendingPaymentByBillNo);

// Order Analytics
router.get("/analytics/sales-summary", getSalesSummary);

module.exports = router;