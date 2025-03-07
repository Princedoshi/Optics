const FormDataModel = require("../models/optics-model");

const getMonthlyCustomerData = async (req, res) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; 

        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

        const customers = await FormDataModel.find({
            date: { $gte: startDate, $lte: endDate } 
        });

        const dailyCounts = {};

        customers.forEach((customer) => {
            const day = customer.date.split('-')[2];
            dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        });

        const formattedData = Object.keys(dailyCounts).map((day) => ({
            day: parseInt(day, 10),
            count: dailyCounts[day],
        })).sort((a, b) => a.day - b.day); 


        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching monthly customer data:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve data" });
    }
};

const getMonthlyRevenueData = async (req, res) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; 

        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

        const orders = await FormDataModel.find({
            date: { $gte: startDate, $lte: endDate } 
        });

        const dailyRevenue = {};

        orders.forEach((order) => {
            const day = order.date.split('-')[2];
            const revenue = parseFloat(order.total) || 0; 
            dailyRevenue[day] = (dailyRevenue[day] || 0) + revenue;
        });

        const formattedData = Object.keys(dailyRevenue).map((day) => ({
            day: parseInt(day, 10),
            revenue: dailyRevenue[day],
        })).sort((a, b) => a.day - b.day); 

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching monthly revenue data:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve data" });
    }
};

const getTopFrames = async (req, res) => {
    try {
        const frameSales = await FormDataModel.aggregate([
            { $match: { frame: { $ne: null } } },
            { $group: { _id: "$frame", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        const formattedData = frameSales.map((frame) => ({
            frame: frame._id,
            count: frame.count,
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching top frames:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve top frames data" });
    }
};

const getCustomerDataByYear = async (req, res) => {
    try {

        const { year } = req.params; 

        if (!year) {
            return res.status(400).json({ success: false, error: "Year is required" });
        }

        const monthlyCounts = Array(12).fill(0); // Initialize an array for 12 months

        const customers = await FormDataModel.find({
            date: { $regex: `^${year}-` } // Match all dates starting with "YYYY-"
        });

        customers.forEach((customer) => {
            const month = parseInt(customer.date.split('-')[1], 10); // Extract month
            monthlyCounts[month - 1] += 1; // Increment count for that month
        });

        const formattedData = monthlyCounts.map((count, index) => ({
            month: index + 1,
            count
        }));


        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching customer data by year:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve data" });
    }
};

const getNewCustomers = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Fetch all customers for the current year
        const currentYearCustomers = await FormDataModel.find({
            date: { $regex: `^${currentYear}-` }
        });

        // Extract unique contact numbers from the current year's customers
        const currentYearContacts = new Set(currentYearCustomers.map(c => c.contact));

        // Find previous customers who had these contacts before the current year
        const previousCustomers = await FormDataModel.find({
            date: { $not: { $regex: `^${currentYear}-` } },
            contact: { $in: Array.from(currentYearContacts) }
        });

        const previousContacts = new Set(previousCustomers.map(c => c.contact));

        // Filter new customers (who don't exist in previousContacts)
        const newCustomers = currentYearCustomers.filter(c => !previousContacts.has(c.contact));

        // Create a Map to ensure unique new customers based on phone numbers
        const uniqueNewCustomers = Array.from(
            new Map(newCustomers.map(customer => [customer.contact, customer])).values()
        );

        // Initialize an array for month-wise count (1 to 12)
        const monthWiseCount = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            count: 0
        }));

        // Count new customers per month
        uniqueNewCustomers.forEach(customer => {
            const month = new Date(customer.date).getMonth(); // Get month (0-11)
            monthWiseCount[month].count++;
        });

        res.status(200).json({ success: true, data: monthWiseCount });
    } catch (error) {
        console.error("Error fetching new customers by month:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve new customers by month" });
    }
};






module.exports = { getMonthlyCustomerData, getMonthlyRevenueData, getTopFrames, getCustomerDataByYear, getNewCustomers };