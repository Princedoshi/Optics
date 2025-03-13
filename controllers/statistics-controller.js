// controllers/statisticsController.js
const mongoose = require('mongoose');
const FormDataModel = require('../models/optics-model');
const User = require('../models/user');
const Branch = require('../models/branch');

const getBranchStatistics = async (req, res) => {
  try {
    const branchStats = await Branch.aggregate([
      {
        $lookup: {
          from: 'formdatas',
          localField: '_id',
          foreignField: 'branchId',
          as: 'formData'
        }
      },
      {
        $unwind: {
          path: '$formData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            branchId: '$_id',
            branchName: '$name'
          },
          totalSales: { $sum: { $toDouble: '$formData.total' } },
          totalCompletedPayments: {
            $sum: {
              $cond: {
                if: { $eq: ['$formData.paymentStatus', 'completed'] },
                then: { $toDouble: '$formData.total' },
                else: 0
              }
            }
          },
          totalPendingPayments: {
            $sum: {
              $cond: {
                if: { $eq: ['$formData.paymentStatus', 'pending'] },
                then: { $toDouble: '$formData.total' },
                else: 0
              }
            }
          },
          formCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          branchId: '$_id.branchId',
          branchName: '$_id.branchName',
          totalSales: 1,
          totalCompletedPayments: 1,
          totalPendingPayments: 1,
          formCount: 1
        }
      },
      {
        $sort: { branchName: 1 }
      }
    ]);

    res.json(branchStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching branch statistics', error: error.message });
  }
};

const getSalesmenStatistics = async (req, res) => {
  try {
    const salesmanStats = await User.aggregate([
      {
        $match: { role: 'salesman' }
      },
      {
        $lookup: {
          from: 'formdatas',
          localField: '_id',
          foreignField: 'salesmanId',
          as: 'formData'
        }
      },
      {
        $unwind: {
          path: '$formData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            salesmanId: '$_id',
            salesmanName: '$name'
          },
          totalSales: { $sum: { $toDouble: '$formData.total' } },
          totalCompletedPayments: {
            $sum: {
              $cond: {
                if: { $eq: ['$formData.paymentStatus', 'completed'] },
                then: { $toDouble: '$formData.total' },
                else: 0
              }
            }
          },
          totalPendingPayments: {
            $sum: {
              $cond: {
                if: { $eq: ['$formData.paymentStatus', 'pending'] },
                then: { $toDouble: '$formData.total' },
                else: 0
              }
            }
          },
          formCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          salesmanId: '$_id.salesmanId',
          salesmanName: '$_id.salesmanName',
          totalSales: 1,
          totalCompletedPayments: 1,
          totalPendingPayments: 1,
          formCount: 1
        }
      },
      {
        $sort: { salesmanName: 1 }
      }
    ]);

    res.json(salesmanStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching salesman statistics', error: error.message });
  }
};

module.exports = { getBranchStatistics, getSalesmenStatistics };