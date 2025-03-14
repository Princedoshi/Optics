// controllers/statisticsController.js
const mongoose = require('mongoose');
const FormDataModel = require('../models/optics-model');
const User = require('../models/user');
const Branch = require('../models/branch');
const moment = require('moment');

const getBranchBusinessToday = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    const owner = req.user;

    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ message: 'Unauthorized: Only owners can access this data.' });
    }

    if (!Array.isArray(owner.branchIds)) {
      console.error("owner.branchIds is not an array:", owner.branchIds);
      return res.status(500).json({ message: 'Error: owner.branchIds is not an array' });
    }

    const ownerBranchIds = owner.branchIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (error) {
        console.warn(`Invalid ObjectId: ${id}. This branch ID will be excluded.`);
        return null;
      }
    }).filter(id => id !== null);

    // Get the start and end of the current day in UTC
    const todayStart = moment.utc().startOf('day').toDate();
    const todayEnd = moment.utc().endOf('day').toDate();

    console.log("todayStart (UTC):", todayStart);
    console.log("todayEnd (UTC):", todayEnd);

    const branchBusiness = await FormDataModel.aggregate([
      {
        $addFields: { //add a stage to transform date strings into Date objects.
          convertedDate: {
            $dateFromString: {
              dateString: "$date",
              format: "%Y-%m-%d", //specify the format
            },
          },
        },
      },
      {
        $match: {
          branchId: { $in: ownerBranchIds },
          convertedDate: { $gte: todayStart, $lte: todayEnd }, //compare againsed convertedDate
        },
      },
       {
        $lookup: {
          from: "branches", // Name of the Branch collection
          localField: "branchId",
          foreignField: "_id",
          as: "branchInfo"
        }
      },
      {
        $unwind: "$branchInfo"
      },
      {
        $group: {
          _id: '$branchId',
          branchName: { $first: '$branchInfo.name' }, // Get the branch name from the branchInfo
          totalSales: { $sum: { $toDouble: '$total' } },
          totalCompletedPayments: {
            $sum: {
              $cond: {
                if: { $eq: ['$paymentStatus', 'paid'] },
                then: { $toDouble: '$total' },
                else: 0
              }
            }
          },
          totalPendingPayments: {
            $sum: {
              $cond: {
                if: { $eq: ['$paymentStatus', 'pending'] },
                then: { $toDouble: '$total' },
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
          branchId: '$_id',
          branchName: 1,
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

    res.json(branchBusiness);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching branch business data for today', error: error.message });
  }
};

const getBranchStatistics = async (req, res) => {
  try {
    const owner = req.user;

    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ message: 'Unauthorized: Only owners can access this data.' });
    }

    if (!Array.isArray(owner.branchIds)) {
      return res.status(500).json({ message: 'Error: owner.branchIds is not an array' });
    }

    const ownerBranchIds = owner.branchIds
      .map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const branchStats = await Branch.aggregate([
      {
        $match: { _id: { $in: ownerBranchIds } }
      },
      {
        $lookup: {
          from: 'formdatas',
          localField: '_id',
          foreignField: 'branchId',
          as: 'formData'
        }
      },
      {
        $addFields: {
          totalSales: {
            $sum: {
              $map: {
                input: '$formData',
                as: 'form',
                in: { $toDouble: '$$form.total' }
              }
            }
          },
          totalPaymentsReceived: {
            $sum: {
              $map: {
                input: '$formData',
                as: 'form',
                in: {
                  $cond: [
                    { $eq: ['$$form.paymentStatus', 'paid'] },
                    { $toDouble: '$$form.total' },
                    {
                      $cond: [
                        { $ifNull: ['$$form.advance', false] },
                        { $toDouble: '$$form.advance' },
                        0
                      ]
                    }
                  ]
                }
              }
            }
          },
          formCount: { $size: '$formData' }
        }
      },
      {
        $addFields: {
          totalPendingPayments: {
            $subtract: ['$totalSales', '$totalPaymentsReceived']
          }
        }
      },
      {
        $project: {
          branchId: '$_id',
          branchName: '$name',
          totalSales: 1,
          totalPaymentsReceived: 1,
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
    console.log("req.user:", req.user);
    const owner = req.user;

    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ message: 'Unauthorized: Only owners can access this data.' });
    }

    if (!Array.isArray(owner.branchIds)) {
      console.error("owner.branchIds is not an array:", owner.branchIds);
      return res.status(500).json({ message: 'Error: owner.branchIds is not an array' });
    }

    // Convert the owner's branchIds to ObjectIds using 'new':
    const ownerBranchIds = owner.branchIds.map(id => {
        try {
            return new mongoose.Types.ObjectId(id); // Use 'new' here!
        } catch (error) {
            console.warn(`Invalid ObjectId: ${id}.  This branch ID will be excluded.`);
            return null;
        }
    }).filter(id => id !== null);

    const salesmanStats = await User.aggregate([
      {
        $match: {
          role: 'salesman',
          branchIds: { $in: ownerBranchIds }
        }
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
                if: { $eq: ['$formData.paymentStatus', 'paid'] },
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
module.exports = { getBranchStatistics, getSalesmenStatistics, getBranchBusinessToday };