// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const { createProduct,getAllProducts,getProductBySku} = require("../../controllers/premium/productController");

router.post("/products", createProduct);
router.get("/products", getAllProducts);
router.get("/products/:sku", getProductBySku);


module.exports = router;
