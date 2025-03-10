const express = require("express");
const { 
    createFormData, 
    getAllFormData, 
    getFormDataByBillNo,
    getPendingPayments,
    updatePendingStatus,
    getPendingPaymentByBillNo
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
    updatePaymentStatus
} = require("../controllers/purchase-controllers");

const { getMonthlyPurchaseDistribution } = require("../controllers/purchase-analytics");

const { getSalesSummary } = require("../controllers/order-analytics-controllers");

const router = express.Router();

// Form Data Routes
router.post("/add-form", createFormData);
router.get("/get-data", getAllFormData);
router.get("/get-data/:billNo", getFormDataByBillNo);

// Customer Analytics Routes
router.get("/customers/monthly", getMonthlyCustomerData);
router.get("/customers/monthly/:year", getCustomerDataByYear);
router.get("/customers/orders", getTopFrames);
router.get("/customers/unique", getNewCustomers);

// Revenue Analytics Routes
router.get("/revenue/monthly", getMonthlyRevenueData);
router.get("/revenue/monthly/:year", getMonthlyRevenueDataByYear);

// Purchase History Routes
router.post("/add-purchase", createPurchase); // Create a purchase
router.get("/get-purchases", getAllPurchases); // Get all purchase records
router.get("/get-purchase/:id", getPurchaseById); // Get a single purchase by purchaseId
router.put("/update-paymentStatus/:id", updatePaymentStatus); // Update payment status

//Purchase Analytics Routes
router.get("/purchases/monthly", getMonthlyPurchaseDistribution);

//Pending Payments
router.get("/pending-payments", getPendingPayments);
router.put("/update-pending-status/:billNo", updatePendingStatus);
router.get("/pending-payments/:billNo",getPendingPaymentByBillNo)

//Order Analytics

router.get("/analytics/sales-summary", getSalesSummary);

module.exports = router;
