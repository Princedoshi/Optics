const PurchaseHistory = require("../models/purchase-model");
const { ObjectId } = require('mongodb'); // Import ObjectId

const getMonthlyPurchaseDistribution = async (req, res) => {
    try {
        const { branchIds } = req.user; 

        
        if (!Array.isArray(branchIds) || branchIds.length === 0) {
            console.log("branchIds is empty or not an array. Returning empty data.");
            return res.json({ success: true, data: [] }); 
        }

 
        const objectIdBranchIds = branchIds.map(id => {
            try {
                return (typeof id === 'string' ? new ObjectId(id) : id);
            } catch (error) {
                console.error(`Invalid branchId: ${id}.  Skipping.`, error);
                return null;
            }
        }).filter(id => id !== null);  // Filter out invalid IDs

        if (objectIdBranchIds.length === 0) {
            console.log("No valid ObjectIds found in branchIds. Returning empty data.");
            return res.json({ success: true, data: [] });  // Return empty data
        }


        const purchases = await PurchaseHistory.aggregate([
            {
                $match: {  // Add a $match stage to filter by branchId
                    branchId: { $in: objectIdBranchIds }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: { $dateFromString: { dateString: "$date", format: "%Y-%m-%d" } } }, // Specify the format
                        month: { $month: { $dateFromString: { dateString: "$date", format: "%Y-%m-%d" } } } // Specify the format
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