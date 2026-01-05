const { User, Wallet } = require("../models");
const { successResponse } = require("../utils/responseHandler");

// @desc    Get user profile by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("wallet")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    successResponse(res, { user }, "User retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Get users with pagination
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("wallet", "totalValue");

    // Get total count
    const total = await User.countDocuments(searchQuery);

    successResponse(
      res,
      {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Users retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    successResponse(
      res,
      { user },
      `User ${isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get user wallet details
// @route   GET /api/users/:id/wallet
// @access  Private/Admin
const getUserWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    successResponse(res, { wallet }, "Wallet retrieved successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserById,
  getAllUsers,
  updateUserStatus,
  getUserWallet,
};
