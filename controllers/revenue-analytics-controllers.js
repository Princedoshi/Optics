const FormDataModel = require("../models/optics-model");


const getMonthlyRevenueDataByYear = async (req, res) => {

    try {
        const { year } = req.params;
        console.log("year:  ",year);

        if (!year) {
            return res.status(400).json({ success: false, error: "Year is required" });
        }

        const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            count: 0
        }));

        const orders = await FormDataModel.find({
            date: { $regex: `^${year}-` } 
        });

        orders.forEach((order) => {
            const month = parseInt(order.date.split('-')[1], 10);
            const revenue = parseFloat(order.total) || 0; 
            monthlyRevenue[month - 1].count += revenue;
        });

        console.log("data",monthlyRevenue);

        res.status(200).json({ success: true, data: monthlyRevenue });
    } catch (error) {
        console.error("Error fetching monthly revenue data by year:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve data" });
    }
};

module.exports = { getMonthlyRevenueDataByYear };
