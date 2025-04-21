const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Format Product Output (Adjusted for no branchId in variants and per-branch SKU) ---
const formatProductOutput = (productWithVariants) => {
    if (!productWithVariants) return null;

    const hasVariants = productWithVariants.variants && productWithVariants.variants.length > 0;

    // Calculate aggregated stock/alert based on variants if they exist, otherwise use product's base values
    const aggregates = hasVariants
        ? {
              total_stock: productWithVariants.variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0),
              min_stock_alert: productWithVariants.variants.reduce((sum, v) => sum + (v.min_stock_alert ?? 0), 0),
          }
        : {
              total_stock: productWithVariants.stock_quantity ?? 0, // Use base stock if no variants
              min_stock_alert: productWithVariants.min_stock_alert ?? 0, // Use base alert if no variants
          };

    return {
        id: productWithVariants.id,
        name: productWithVariants.name,
        sku: productWithVariants.sku, // SKU is part of the product identity
        category: productWithVariants.category,
        brand: productWithVariants.brand,
        purchase_price: productWithVariants.purchase_price ?? null,
        selling_price: productWithVariants.selling_price ?? null,
        stock_quantity: aggregates.total_stock,
        min_stock_alert: aggregates.min_stock_alert,
        created_at: productWithVariants.created_at,
        updated_at: productWithVariants.updated_at,
        // Format variants WITHOUT expecting branchId
        variants: productWithVariants.variants?.map(v => ({
            id: v.id,
            productId: v.productId,
            color: v.color,
            stock_quantity: v.stock_quantity,
            min_stock_alert: v.min_stock_alert,
            created_at: v.created_at,
            updated_at: v.updated_at
        })) || [],
        // Parent product's branchId is implicitly known by the query context,
        // usually not included directly in API response unless specifically needed.
    };
};

// --- Create Product (Handles per-branch SKU uniqueness) ---
const createProduct = async (req, res) => {
    const { branchIds } = req.user;

    // Validate and extract the SINGLE branch ID
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0 || typeof branchIds[0] !== 'string') {
        console.error("Invalid branchIds received:", branchIds);
        return res.status(403).json({ success: false, error: 'Forbidden: Valid Branch information missing for this user.' });
    }
    const currentBranchId = branchIds[0];

    try {
        const { name, sku, category, brand, purchase_price, selling_price, stock_quantity, min_stock_alert, variants } = req.body;

        // Basic field validation
        if (!name || !sku || !category || !brand) {
            return res.status(400).json({ success: false, error: 'Missing required fields: name, sku, category, or brand.' });
        }
        if (purchase_price === undefined || purchase_price === null || selling_price === undefined || selling_price === null) {
            return res.status(400).json({ success: false, error: 'Purchase price and selling price are required.' });
        }

        const hasVariants = variants && Array.isArray(variants) && variants.length > 0;
        const productSku = sku.trim(); // Trim SKU

        // Prepare Product Data - branchId assigned only to Product
        const productData = {
            branchId: currentBranchId,
            name,
            sku: productSku,
            category,
            brand,
            purchase_price: purchase_price !== null ? parseFloat(purchase_price) : null,
            selling_price: selling_price !== null ? parseFloat(selling_price) : null,
            stock_quantity: 0, // Default, will be updated later
            min_stock_alert: 0, // Default, will be updated later
            variants: hasVariants
                ? {
                      create: variants.map(variant => {
                          // Validate variant data
                          if (!variant.color || typeof variant.color !== 'string' || variant.color.trim() === '') {
                              throw new Error('Variant color is required and must be a non-empty string.');
                          }
                          const variantStock = variant.stock_quantity != null ? parseInt(String(variant.stock_quantity), 10) : 0;
                          const variantMinStock = variant.min_stock_alert != null ? parseInt(String(variant.min_stock_alert), 10) : 0;
                          if (isNaN(variantStock) || isNaN(variantMinStock)) {
                              throw new Error('Invalid numeric value provided for variant stock_quantity or min_stock_alert.');
                          }
                          if (variantStock < 0 || variantMinStock < 0) {
                                throw new Error('Stock quantity and minimum stock alert cannot be negative.');
                          }
                          // Return variant data WITHOUT branchId
                          return {
                              color: variant.color.trim(),
                              stock_quantity: variantStock,
                              min_stock_alert: variantMinStock,
                          };
                      }),
                  }
                : undefined,
        };

        // Handle stock for non-variant product
        if (!hasVariants) {
             const initialStock = stock_quantity != null ? parseInt(String(stock_quantity), 10) : 0;
             const initialMinStock = min_stock_alert != null ? parseInt(String(min_stock_alert), 10) : 0;
             if (isNaN(initialStock) || isNaN(initialMinStock)) {
                 throw new Error('Invalid numeric value provided for product stock_quantity or min_stock_alert.');
             }
             if (initialStock < 0 || initialMinStock < 0) {
                 throw new Error('Stock quantity and minimum stock alert cannot be negative.');
             }
            productData.stock_quantity = initialStock;
            productData.min_stock_alert = initialMinStock;
        }

        // Create product (and variants if provided) in a transaction
        const createdProduct = await prisma.product.create({
            data: productData,
            include: {
                variants: { orderBy: { color: 'asc' } }, // Include variants in the result
            },
        });

        // If variants were created, update the product's aggregates
        let finalProduct = createdProduct;
        if (hasVariants && createdProduct.variants.length > 0) {
            const totalStock = createdProduct.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
            const totalMinStockAlert = createdProduct.variants.reduce((sum, v) => sum + v.min_stock_alert, 0);

            // Use update to set the correct aggregated values
            finalProduct = await prisma.product.update({
                where: { id: createdProduct.id },
                data: {
                    stock_quantity: totalStock,
                    min_stock_alert: totalMinStockAlert,
                },
                include: { // Re-include variants for the final response
                    variants: { orderBy: { color: 'asc' } },
                },
            });
        }

        // Format and return the final product state
        const formattedProduct = formatProductOutput(finalProduct);
        res.status(201).json({ success: true, message: 'Product created successfully', product: formattedProduct });

    } catch (error) {
        // --- Error Handling ---
        console.error('Create Product Error:', {
             message: error.message,
             stack: error.stack,
             code: error.code, // Log Prisma error code if available
             meta: error.meta, // Log Prisma meta data if available
         });

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Unique constraint violation
            if (error.code === 'P2002') {
                const target = error.meta?.target || [];
                // Check for Branch + SKU unique constraint
                if (target?.includes('branchId') && target?.includes('sku')) {
                    return res.status(409).json({ success: false, error: `Product with SKU '${req.body.sku?.trim()}' already exists in this branch.` });
                }
                // Check for Variant unique constraint (productId_color)
                if (target?.includes('productId') && target?.includes('color')) {
                     return res.status(409).json({ success: false, error: `A variant with one of the specified colors already exists for this product.` });
                 }
                // Generic unique constraint failure message
                return res.status(409).json({ success: false, error: 'Conflict: A unique constraint failed.', details: target?.join(', ') });
            }
            // Foreign key constraint failed
            if (error.code === 'P2003') {
                 console.error("Foreign Key Constraint Failed:", error.meta);
                 return res.status(400).json({ success: false, error: 'Invalid reference to related data.'});
            }
            // Handle other known Prisma errors if needed
        }

        // Custom validation errors thrown earlier
        if (error.message.includes('Variant color is required') ||
            error.message.includes('Invalid numeric value') ||
            error.message.includes('cannot be negative')) {
            return res.status(400).json({ success: false, error: error.message });
        }

        // Prisma validation errors (e.g., wrong data type sent)
        if (error instanceof Prisma.PrismaClientValidationError) {
            console.error('Prisma Validation Error:', error.message);
            const match = error.message.match(/Argument `(.*?)`: Invalid value provided/);
            const field = match ? match[1] : 'data';
            return res.status(400).json({ success: false, error: `Invalid data provided for field '${field}'. Please check input types and required fields.`});
        }

        // Generic fallback server error
        res.status(500).json({ success: false, error: 'Failed to create product due to an internal server error.' });
    }
};

// --- Get All Products (Filters by Product.branchId) ---
const getAllProducts = async (req, res) => {
    const { branchIds } = req.user;

    // Validate and extract the SINGLE branch ID
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0 || typeof branchIds[0] !== 'string') {
        return res.status(403).json({ success: false, error: 'Forbidden: Valid Branch information missing.' });
    }
    const currentBranchId = branchIds[0];

    try {
        // Query PRODUCTS filtered by the user's branchId
        const productsWithVariants = await prisma.product.findMany({
            where: {
                branchId: currentBranchId, // Filtering happens here
            },
            include: {
                // Include variants associated with the filtered products
                variants: { orderBy: { color: 'asc' } },
            },
            orderBy: { created_at: 'desc' }, // Order products by creation date
        });

        // Format the results
        const formattedProducts = productsWithVariants.map(formatProductOutput);

        res.status(200).json({
            success: true,
            count: formattedProducts.length,
            data: formattedProducts,
        });
    } catch (error) {
        console.error(`Error fetching products for branch ${currentBranchId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products due to an internal server error.',
            // error: error.message, // Avoid sending detailed error in production
        });
    }
};

// --- Get Product by SKU (Uses composite key branchId_sku for lookup) ---
const getProductBySku = async (req, res) => {
    const { branchIds } = req.user;
    const { sku } = req.params;

    // Validate and extract the SINGLE branch ID
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0 || typeof branchIds[0] !== 'string') {
         return res.status(403).json({ success: false, error: 'Forbidden: Valid Branch information missing.' });
    }
    const currentBranchId = branchIds[0];

    // Validate SKU param
    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
        return res.status(400).json({ success: false, message: 'Valid SKU parameter is required.' });
    }
    const requestedSku = sku.trim();

    try {
        // Use composite unique identifier (branchId + sku) for lookup
        const productWithVariants = await prisma.product.findUnique({
            where: {
                 // Prisma syntax for composite unique index lookup: modelName_fieldName1_fieldName2
                 branchId_sku: {
                     branchId: currentBranchId,
                     sku: requestedSku,
                 }
            },
            include: {
                variants: { orderBy: { color: 'asc' } }, // Include associated variants
            },
        });

        // If findUnique using the composite key returns null, it means
        // the product with that SKU doesn't exist *in this specific branch*.
        if (!productWithVariants) {
            return res.status(404).json({ success: false, message: `Product with SKU '${requestedSku}' not found in your branch.` });
        }

        // Format and return the found product
        const formattedProduct = formatProductOutput(productWithVariants);
        res.status(200).json({
            success: true,
            data: formattedProduct,
        });

    } catch (error) {
        console.error(`Error fetching product with SKU ${requestedSku} for branch ${currentBranchId}:`, error);

        // Handle potential database connection errors or unexpected Prisma issues
        if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
           return res.status(500).json({ success: false, message: 'Database connection error.'})
        }
        // Generic fallback
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product due to an internal server error.',
            // error: error.message, // Avoid sending detailed error in production
        });
    }
};

// --- Exports ---
module.exports = {
    createProduct,
    getAllProducts,
    getProductBySku,
};