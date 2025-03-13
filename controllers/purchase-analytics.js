const PurchaseHistory = require("../models/purchase-model");

const getMonthlyPurchaseDistribution = async (req, res) => {
    try {
        const { branchIds } = req.user;  // Get the branchIds from req.user

        const purchases = await PurchaseHistory.aggregate([
            {
                $match: {  // Add a $match stage to filter by branchId
                    branchId: { $in: branchIds }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: { $dateFromString: { dateString: "$date" } } },
                        month: { $month: { $dateFromString: { dateString: "$date" } } }
                    },
                    totalPurchases: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Convert data into frontend-friendly format
        const formattedData = purchases.map(p => ({
            month: `${p._id.year}-${String(p._id.month).padStart(2, "0")}`, // YYYY-MM format
            totalPurchases: p.totalPurchases,
            totalAmount: p.totalAmount
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching monthly distribution:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getMonthlyPurchaseDistribution };