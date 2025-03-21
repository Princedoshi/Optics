const FormDataModel = require("../models/optics-model");
const _ = require('lodash'); // Import lodash for field whitelisting

const getAllFormData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const filter = { branchId: { $in: branchIds } };
        const allData = await FormDataModel.find(filter);
        res.status(200).json(allData);
    } catch (error) {
        console.error("Error fetching form data:", error);
        res.status(500).json({ error: "Failed to retrieve data" });
    }
};

const createFormData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const userBranchId = req.body.branchId;

        // Restrict creation to allowed branches
        if (!branchIds.includes(userBranchId)) {
            return res.status(403).json({ success: false, error: "Unauthorized branch access" });
        }

        // Find the last entry for the specific branch
        const lastEntryForBranch = await FormDataModel.findOne({ branchId: userBranchId }).sort({ billNo: -1 });

        // Determine the new bill number based on the branch's last entry
        let newBillNo;
        if (lastEntryForBranch && !isNaN(lastEntryForBranch.billNo)) {
            newBillNo = lastEntryForBranch.billNo + 1;
        } else {
            // If no entries for the branch, start at 1
            newBillNo = 1;
        }

        const newFormData = new FormDataModel({
            billNo: newBillNo,
            ...req.body,
        });

        await newFormData.save();
        res.status(201).json({ success: true, data: newFormData });
    } catch (error) {
        console.error("Error creating form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getFormDataByBillNo = async (req, res) => {
    const { branchIds } = req.user;
    const billNo = parseInt(req.params.billNo, 10);
    if (isNaN(billNo)) {
        return res.status(400).json({ success: false, error: "Invalid bill number" });
    }

    try {
        const filter = { billNo, branchId: { $in: branchIds } };
        const formData = await FormDataModel.findOne(filter);

        if (!formData) {
            return res.status(404).json({ success: false, error: "Form data not found or unauthorized" });
        }

        res.status(200).json({ success: true, data: formData });
    } catch (error) {
        console.error("Error fetching form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const getPendingPayments = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const filter = { paymentStatus: "pending", branchId: { $in: branchIds } };
        const pendingData = await FormDataModel.find(filter);
        res.status(200).json(pendingData);
    } catch (error) {
        console.error("Error fetching pending payment data:", error);
        res.status(500).json({ error: "Failed to retrieve pending payment data" });
    }
};


const updatePendingStatus = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const billNo = parseInt(req.params.billNo, 10);
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const filter = {
            billNo,
            paymentStatus: "pending",
            branchId: { $in: branchIds }
        };

        const updatedForm = await FormDataModel.findOneAndUpdate(
            filter,
            { paymentStatus: "completed" },
            { new: true }
        );

        if (!updatedForm) {
            return res.status(404).json({ success: false, error: "Pending payment not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Payment status updated to paid", data: updatedForm });
    } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getPendingPaymentByBillNo = async (req, res) => {
    const { branchIds } = req.user;
    const billNo = parseInt(req.params.billNo, 10);
    if (isNaN(billNo)) {
        return res.status(400).json({ success: false, error: "Invalid bill number" });
    }

    try {
        const filter = {
            billNo,
            paymentStatus: "pending",
            branchId: { $in: branchIds }
        };

        const pendingPayment = await FormDataModel.findOne(filter);

        if (!pendingPayment) {
            return res.status(404).json({ success: false, error: "No pending payment found or unauthorized access" });
        }

        res.status(200).json({ success: true, data: pendingPayment });
    } catch (error) {
        console.error("Error fetching pending payment by billNo:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateFormData = async (req, res) => {
  try {
    const { branchIds } = req.user;
    const formId = req.params.id;

    const filter = {
      _id: formId,
      branchId: { $in: branchIds }
    };

    const allowedFields = [
      'name', 'contact', 'date', 'frame', 'glass', 'contactLens',
      'framePrice', 'glassPrice', 'contactLensPrice', 'advance',
      'paymentStatus',
      'prescription.dist.rightSph', 'prescription.dist.rightCyl', 'prescription.dist.rightAxis',
      'prescription.dist.leftSph', 'prescription.dist.leftCyl', 'prescription.dist.leftAxis',
      'prescription.near.rightSph', 'prescription.near.rightCyl', 'prescription.near.rightAxis',
      'prescription.near.leftSph', 'prescription.near.leftCyl', 'prescription.near.leftAxis',
      'prescription.notes'
    ];

    const updateData = _.pick(req.body, allowedFields);

    const existingData = await FormDataModel.findOne(filter);
    if (!existingData) {
      return res.status(404).json({ success: false, error: "Form data not found or unauthorized" });
    }

    if (
      updateData.hasOwnProperty('framePrice') ||
      updateData.hasOwnProperty('glassPrice') ||
      updateData.hasOwnProperty('contactLensPrice')
    ) {
      const framePrice = parseFloat(updateData.framePrice ?? existingData.framePrice) || 0;
      const glassPrice = parseFloat(updateData.glassPrice ?? existingData.glassPrice) || 0;
      const contactLensPrice = parseFloat(updateData.contactLensPrice ?? existingData.contactLensPrice) || 0;

      if (!isNaN(framePrice) && !isNaN(glassPrice) && !isNaN(contactLensPrice)) {
        updateData.total = (framePrice + glassPrice + contactLensPrice).toString();
      } else {
        return res.status(400).json({ success: false, error: "Prices must be valid numbers." });
      }
    }

    if (updateData.hasOwnProperty('total') || updateData.hasOwnProperty('advance')) {
      const total = parseFloat(updateData.total ?? existingData.total) || 0;
      const advance = parseFloat(updateData.advance ?? existingData.advance) || 0;

      if (!isNaN(total) && !isNaN(advance)) {
        updateData.balance = (total - advance).toString();
      } else {
        return res.status(400).json({ success: false, error: "Total and Advance must be valid numbers." });
      }
    }

    const updatedFormData = await FormDataModel.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedFormData) {
      return res.status(404).json({ success: false, error: "Form data not found or unauthorized" });
    }

    res.status(200).json({ success: true, data: updatedFormData });

  } catch (error) {
    console.error("Error updating form data:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};



module.exports = {
    createFormData,
    getAllFormData,
    getFormDataByBillNo,
    getPendingPayments,
    updatePendingStatus,
    getPendingPaymentByBillNo,
    updateFormData
};