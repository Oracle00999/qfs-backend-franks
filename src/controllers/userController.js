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
    const { search = "" } = req.query;

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Get all users (no pagination)
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 })
      .populate("wallet", "totalValue");

    successResponse(res, { users }, "Users retrieved successfully");
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
      { new: true, runValidators: true },
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
      `User ${isActive ? "activated" : "deactivated"} successfully`,
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
