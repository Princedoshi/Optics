// helper/_enhanceProductWithVariantData.js

const _enhanceProductWithVariantData = (product) => {
  if (
    product &&
    product.variants &&
    product.variants.length > 0 &&
    product.purchase_price === null &&
    product.selling_price === null
  ) {
    const variants = product.variants;

    // Calculate TOTAL Purchase Price
    const totalPurchasePrice = variants.reduce(
      (sum, variant) => sum + (variant.purchase_price || 0),
      0
    );

    // Calculate TOTAL Selling Price
    const totalSellingPrice = variants.reduce(
      (sum, variant) => sum + (variant.selling_price || 0),
      0
    );

    // Calculate Total Stock
    const totalStock = variants.reduce(
      (sum, variant) => sum + (variant.stock_quantity || 0),
      0
    );

    // Calculate Minimum Alert Level
    const minAlert = variants.reduce(
      (min, variant) => Math.min(min, variant.min_stock_alert || Infinity),
      Infinity
    );
    const effectiveMinAlert = minAlert === Infinity ? null : minAlert;

    // Return a *new* object with aggregated values
    return {
      ...product,
      // Return the raw numbers (Floats)
      purchase_price: totalPurchasePrice,  // <-- REMOVED .toFixed(2)
      selling_price: totalSellingPrice,   // <-- REMOVED .toFixed(2)
      stock_quantity: totalStock,
      min_stock_alert: effectiveMinAlert,
    };
  }

  // If no aggregation needed, return the product as is
  return product;
};

// Export using CommonJS
module.exports = _enhanceProductWithVariantData;