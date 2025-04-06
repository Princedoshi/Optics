// controllers/premium/productController.js
const prisma = require('../../prisma/prisma-client'); // Ensure this path is correct
const enhanceProductWithVariantData = require('../../helper/_enhanceProductWithVariantData'); // Ensure this path is correct

// --- createProduct function (keep as is from your last version) ---
const createProduct = async (req, res) => {
  // ... (your existing createProduct implementation)
    try {
    const {
      name,
      sku,
      category,
      brand,
      purchase_price, // Optional for base product
      selling_price,  // Optional for base product
      stock_quantity, // Optional for base product
      min_stock_alert,// Optional for base product
      variants,       // Array of variant objects
    } = req.body;

    if (!name || !sku || !category || !brand) {
      return res.status(400).json({ error: 'Missing required base product fields (name, sku, category, brand).' });
    }

    const hasVariants = variants && Array.isArray(variants) && variants.length > 0;

    const productData = {
      name,
      sku,
      category,
      brand,
      purchase_price: !hasVariants && purchase_price !== undefined ? parseFloat(purchase_price) : null,
      selling_price: !hasVariants && selling_price !== undefined ? parseFloat(selling_price) : null,
      stock_quantity: !hasVariants && stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null,
      min_stock_alert: !hasVariants && min_stock_alert !== undefined ? parseInt(min_stock_alert, 10) : null,
      variants: hasVariants
        ? {
            create: variants.map((variant) => ({
              color: variant.color,
              purchase_price: parseFloat(variant.purchase_price),
              selling_price: parseFloat(variant.selling_price),
              stock_quantity: parseInt(variant.stock_quantity, 10) || 0,
              min_stock_alert: parseInt(variant.min_stock_alert, 10),
            })),
          }
        : undefined,
    };


    const product = await prisma.product.create({
      data: productData,
      include: {
        variants: true,
      }
    });

    // Enhance the single created product before sending response
    const enhancedProduct = enhanceProductWithVariantData(product);

    res.status(201).json({ message: 'Product created successfully', product: enhancedProduct });

  } catch (error) {
    console.error('Create Product Error:', JSON.stringify(error, null, 2));
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      return res.status(409).json({ error: `Product with SKU '${req.body.sku}' already exists.` });
    }
     if (error.code === 'P2002' && error.meta?.target?.includes('ProductVariant_productId_color_key')) { // Check specific constraint name if known
       return res.status(409).json({ error: `A variant with one of the specified colors already exists for this product.` });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- Update getAllProducts to use the helper ---
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          orderBy: { color: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Use the helper function to enhance each product needing aggregation
    const enhancedProducts = products.map(enhanceProductWithVariantData);

    res.status(200).json({
      success: true,
      count: enhancedProducts.length,
      data: enhancedProducts,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

// --- Update getProductBySku to use the helper ---
const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    if (!sku) {
      return res.status(400).json({ success: false, message: "SKU parameter is required." });
    }

    const product = await prisma.product.findUnique({
      where: { sku: sku },
      include: {
        variants: {
          orderBy: { color: 'asc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: `Product with SKU '${sku}' not found.` });
    }

    // Use the helper function to enhance the product if needed
    const enhancedProduct = enhanceProductWithVariantData(product);

    res.status(200).json({
      success: true,
      data: enhancedProduct, // Return the potentially enhanced product
    });

  } catch (error) {
    console.error(`Error fetching product with SKU ${req.params.sku}:`, error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the product',
    });
  }
};


// --- Export all functions ---
module.exports = {
  createProduct,
  getAllProducts,
  getProductBySku,
};