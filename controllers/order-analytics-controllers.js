const FormDataModel = require("../models/optics-model");

const getSalesSummary = async (req, res) => {
    try {
        const { role, branchIds } = req.user;


        let filter = {};
        if (role === "owner") {
            // 1. Convert branchIds to ObjectIds:  Crucial step!
            const objectIdBranchIds = branchIds.map(id => {
                try {
                    return new mongoose.Types.ObjectId(id); // Convert to ObjectId
                } catch (error) {
                    console.error(`Invalid ObjectId: ${id}`, error);
                    // Handle the error appropriately, e.g., skip this ID or return an error
                    return null; // Or throw an error, depending on your needs.  Skipping is safer.
                }
            }).filter(id => id !== null); // Remove any nulls resulting from invalid IDs

            // 2. Construct the filter
            filter = { branchId: { $in: objectIdBranchIds } };

        }

        // 3. Query the database
        const sales = await FormDataModel.find(filter);

        // 4. Process the sales data
        let frameCount = 0;
        let glassCount = 0;
        let contactLensCount = 0;

        sales.forEach(sale => {
            if (sale.frame && sale.frame.trim() !== "") frameCount++;
            if (sale.glass && sale.glass.trim() !== "") glassCount++;
            if (sale.contactLens && sale.contactLens.trim() !== "") contactLensCount++;
        });

        // 5. Send the response
        res.json({
            framesSold: frameCount,
            glassesSold: glassCount,
            contactLensesSold: contactLensCount,
        });

    } catch (error) {
        console.error("Error fetching sales summary:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
module.exports = { getSalesSummary };