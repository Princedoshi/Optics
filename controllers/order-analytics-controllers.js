const FormDataModel = require("../models/optics-model");


const getSalesSummary = async (req, res) => {
    try {
        const sales = await FormDataModel.find();
        
        let frameCount = 0;
        let glassCount = 0;
        let contactLensCount = 0;
        
        sales.forEach(sale => {
            if (sale.frame && sale.frame.trim() !== "") frameCount++;
            if (sale.glass && sale.glass.trim() !== "") glassCount++;
            if (sale.contactLens && sale.contactLens.trim() !== "") contactLensCount++;
        });
        
        res.json({
            framesSold: frameCount,
            glassesSold: glassCount,
            contactLensesSold: contactLensCount,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getSalesSummary };
