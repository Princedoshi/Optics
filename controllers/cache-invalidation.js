const { redisClient } = require("../config/redis-client");

const invalidateAllFormDataCache = async (branchIds) => {
    const cacheKey = `allFormData:${branchIds.join(",")}`;
    try {
        await redisClient.del(cacheKey);
        console.log(`Invalidated cache: ${cacheKey}`);
    } catch (error) {
        console.error(`Error invalidating cache ${cacheKey}:`, error);
    }
};

const invalidatePendingPaymentsCache = async (branchIds) => {
    const cacheKey = `pendingPayments:${branchIds.join(",")}`;
    try {
        await redisClient.del(cacheKey);
        console.log(`Invalidated cache: ${cacheKey}`);
    } catch (error) {
        console.error(`Error invalidating cache ${cacheKey}:`, error);
    }
};

const invalidatePendingPaymentByBillNoCache = async (billNo, branchIds) => {
    const cacheKey = `pendingPayment:${billNo}:${branchIds.join(",")}`;
    try {
        await redisClient.del(cacheKey);
        console.log(`Invalidated cache: ${cacheKey}`);
    } catch (error) {
        console.error(`Error invalidating cache ${cacheKey}:`, error);
    }
};

const invalidateFormDataByBillNoCache = async (billNo, branchIds) => {
    const cacheKey = `formData:${billNo}:${branchIds.join(",")}`;
    try {
        await redisClient.del(cacheKey);
        console.log(`Invalidated cache: ${cacheKey}`);
    } catch (error) {
        console.error(`Error invalidating cache ${cacheKey}:`, error);
    }
};


module.exports = {
    invalidateAllFormDataCache,
    invalidatePendingPaymentsCache,
    invalidatePendingPaymentByBillNoCache,
    invalidateFormDataByBillNoCache,
};