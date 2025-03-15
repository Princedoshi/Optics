const FormDataModel = require("../models/optics-model");
const mongoose = require('mongoose');


const getMonthlyCustomerData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const filter = { branchId: { $in: branchIds } };

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

        const customers = await FormDataModel.find({
            ...filter,
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
        const { branchIds } = req.user;
        const filter = { branchId: { $in: branchIds } };

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

        const orders = await FormDataModel.find({
            ...filter,
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
        const { branchIds } = req.user;

        // 1. Convert branchIds to ObjectIds (with error handling):
        const objectIdBranchIds = branchIds.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (error) {
                console.error(`Invalid ObjectId: ${id}`, error);
                return null; // Skip invalid IDs
            }
        }).filter(id => id !== null); // Remove nulls

        // 2. Construct the filter for the $match stage:
        const filter = {
            branchId: { $in: objectIdBranchIds },
            frame: { $ne: null, $ne: "" }  // Exclude null and empty strings
        };

        // 3. Aggregate the data:
        const frameSales = await FormDataModel.aggregate([
            { $match: filter }, // Use the combined filter
            { $group: { _id: "$frame", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        // 4. Format the data:
        const formattedData = frameSales.map((frame) => ({
            frame: frame._id,
            count: frame.count,
        }));

        // 5. Send the response:
        res.status(200).json({ success: true, data: formattedData });

    } catch (error) {
        console.error("Error fetching top frames:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve top frames data" });
    }
};
const getCustomerDataByYear = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const filter = { branchId: { $in: branchIds } };
        const { year } = req.params;

        if (!year) {
            return res.status(400).json({ success: false, error: "Year is required" });
        }

        const monthlyCounts = Array(12).fill(0);

        const customers = await FormDataModel.find({
            ...filter,
            date: { $regex: `^${year}-` }
        });

        customers.forEach((customer) => {
            const month = parseInt(customer.date.split('-')[1], 10);
            monthlyCounts[month - 1] += 1;
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
        const { branchIds } = req.user;
        const filter = { branchId: { $in: branchIds } };

        const currentYear = new Date().getFullYear();

        const currentYearCustomers = await FormDataModel.find({
            ...filter,
            date: { $regex: `^${currentYear}-` }
        });

        const currentYearContacts = new Set(currentYearCustomers.map(c => c.contact));

        const previousCustomers = await FormDataModel.find({
            ...filter,
            date: { $not: { $regex: `^${currentYear}-` } },
            contact: { $in: Array.from(currentYearContacts) }
        });

        const previousContacts = new Set(previousCustomers.map(c => c.contact));

        const newCustomers = currentYearCustomers.filter(c => !previousContacts.has(c.contact));

        const uniqueNewCustomers = Array.from(
            new Map(newCustomers.map(customer => [customer.contact, customer])).values()
        );

        const monthWiseCount = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            count: 0
        }));

        uniqueNewCustomers.forEach(customer => {
            const month = new Date(customer.date).getMonth();
            monthWiseCount[month].count++;
        });

        res.status(200).json({ success: true, data: monthWiseCount });
    } catch (error) {
        console.error("Error fetching new customers by month:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve new customers by month" });
    }
};

module.exports = {
    getMonthlyCustomerData,
    getMonthlyRevenueData,
    getTopFrames,
    getCustomerDataByYear,
    getNewCustomers
};
