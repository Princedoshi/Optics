const PurchaseHistory = require("../models/purchase-model");
const { ObjectId } = require("mongodb"); // Import ObjectId

const getMonthlyPurchaseDistribution = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { branchIds } = req.user;

        // Check if branchIds exists and is an array
        if (!Array.isArray(branchIds) || branchIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Convert branchIds to ObjectId
        const objectIdBranchIds = branchIds.map(id => {
            try {
                return typeof id === "string" ? new ObjectId(id) : id;
            } catch (error) {
                return null;
            }
        }).filter(id => id !== null);

        if (objectIdBranchIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const purchases = await PurchaseHistory.aggregate([
            {
                $match: { branchId: { $in: objectIdBranchIds } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: { $toDate: "$date" } },
                        month: { $month: { $toDate: "$date" } }
                    },
                    totalPurchases: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Convert to frontend-friendly format
        const formattedData = purchases.map(p => ({
            month: `${p._id.year}-${String(p._id.month).padStart(2, "0")}`, // YYYY-MM format
            totalPurchases: p.totalPurchases,
            totalAmount: p.totalAmount
        }));

        res.json({ success: true, data: formattedData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMonthlyPurchaseDistribution };
