const FormDataModel = require("../models/optics-model");

const getMonthlyRevenueDataByYear = async (req, res) => {
    try {
        const { role, branchIds } = req.user;
        const { year } = req.params;

        if (!year) {
            return res.status(400).json({ success: false, error: "Year is required" });
        }

        // ✅ Always filter by branchIds (even for owners)
        const filter = {
            branchId: { $in: branchIds },
            date: { $regex: `^${year}-` }
        };

        const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            count: 0
        }));

        let totalRevenue = 0;

        const orders = await FormDataModel.find(filter);

        orders.forEach((order) => {
            const month = parseInt(order.date.split('-')[1], 10);
            const revenue = parseFloat(order.total) || 0;
            monthlyRevenue[month - 1].count += revenue;
            totalRevenue += revenue;
        });

        res.status(200).json({
            success: true,
            totalRevenue,
            data: monthlyRevenue
        });
    } catch (error) {
        console.error("Error fetching monthly revenue data by year:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve data" });
    }
};

module.exports = { getMonthlyRevenueDataByYear };
