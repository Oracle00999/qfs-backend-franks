const mongoose = require("mongoose");
const fs = require("fs/promises");
const {
  CryptoAddress,
  User,
  Wallet,
  Transaction,
  Swap,
  Kyc,
  ResetCode,
} = require("../models");
const { successResponse } = require("../utils/responseHandler");

// @desc    Permanently delete a user and their data, preserving linked wallets
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
const deleteUserAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(userId).select("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Admins are referenced in audit fields throughout the application.
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be deleted with this endpoint",
      });
    }

    const kycRecords = await Kyc.find({ user: userId }).select(
      "documentFront documentBack selfieWithDocument",
    );
    const kycFilePaths = kycRecords.flatMap((kyc) =>
      [kyc.documentFront, kyc.documentBack, kyc.selfieWithDocument].filter(
        Boolean,
      ),
    );

    await mongoose.connection.transaction(async (session) => {
      // Run transaction operations sequentially; parallel operations within a
      // MongoDB transaction are not supported.
      await Wallet.deleteMany({ user: userId }).session(session);
      await Transaction.deleteMany({ user: userId }).session(session);
      await Swap.deleteMany({ user: userId }).session(session);
      await Kyc.deleteMany({ user: userId }).session(session);
      await ResetCode.deleteMany({ user: userId }).session(session);

      const deletedUser = await User.deleteOne({ _id: userId }).session(session);
      if (deletedUser.deletedCount !== 1) {
        throw new Error("User could not be deleted");
      }
    });

    // Database deletion is complete at this point; remove uploaded KYC files too.
    const fileDeletionResults = await Promise.allSettled(
      kycFilePaths.map((filePath) => fs.unlink(filePath)),
    );
    fileDeletionResults.forEach((result, index) => {
      if (result.status === "rejected" && result.reason?.code !== "ENOENT") {
        console.error(
          `Failed to delete KYC file ${kycFilePaths[index]}:`,
          result.reason,
        );
      }
    });

    successResponse(
      res,
      {},
      "User account deleted successfully; linked wallets were preserved",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update cryptocurrency deposit address
// @route   POST /api/admin/crypto-addresses
// @access  Private/Admin
const addOrUpdateCryptoAddress = async (req, res, next) => {
  try {
    const { cryptocurrency, address, network, notes } = req.body;
    const adminId = req.user.id;

    // Check if cryptocurrency is valid
    const validCryptos = [
      "bitcoin",
      "ethereum",
      "tether",
      "binance-coin",
      "solana",
      "ripple",
      "stellar",
      "dogecoin",
      "tron",
      "litecoin",
    ];

    if (!validCryptos.includes(cryptocurrency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cryptocurrency",
      });
    }

    // Check if address already exists for this cryptocurrency
    const existingAddress = await CryptoAddress.findOne({ cryptocurrency });

    let cryptoAddress;

    if (existingAddress) {
      // Update existing address
      existingAddress.address = address;
      if (network !== undefined) existingAddress.network = network;
      existingAddress.addedBy = adminId;
      existingAddress.isActive = true;

      cryptoAddress = await existingAddress.save();
    } else {
      // Create new address
      cryptoAddress = await CryptoAddress.create({
        cryptocurrency,
        address,
        network,
        addedBy: adminId,
        isActive: true,
      });
    }

    successResponse(
      res,
      {
        cryptoAddress: cryptoAddress.getDisplayInfo(),
      },
      "Cryptocurrency address saved successfully",
    );
  } catch (error) {
    next(error);
  }
};
// @desc    Get all cryptocurrency addresses
// @route   GET /api/admin/crypto-addresses
// @access  Private/Admin
const getAllCryptoAddresses = async (req, res, next) => {
  try {
    const cryptoAddresses = await CryptoAddress.find()
      .sort({ cryptocurrency: 1 })
      .populate("addedBy", "firstName lastName email");

    const formattedAddresses = cryptoAddresses.map((address) => ({
      ...address.getDisplayInfo(),
      addedBy: address.addedBy
        ? {
            name: `${address.addedBy.firstName} ${address.addedBy.lastName}`,
            email: address.addedBy.email,
          }
        : null,
      updatedAt: address.updatedAt,
    }));

    successResponse(
      res,
      {
        cryptoAddresses: formattedAddresses,
      },
      "Cryptocurrency addresses retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific cryptocurrency address
// @route   GET /api/admin/crypto-addresses/:cryptocurrency
// @access  Private/Admin
const getCryptoAddress = async (req, res, next) => {
  try {
    const { cryptocurrency } = req.params;

    const cryptoAddress = await CryptoAddress.findOne({
      cryptocurrency,
    }).populate("addedBy", "firstName lastName email");

    if (!cryptoAddress) {
      return res.status(404).json({
        success: false,
        message: "Cryptocurrency address not found",
      });
    }

    successResponse(
      res,
      {
        cryptoAddress: {
          ...cryptoAddress.getDisplayInfo(),
          addedBy: cryptoAddress.addedBy
            ? {
                name: `${cryptoAddress.addedBy.firstName} ${cryptoAddress.addedBy.lastName}`,
                email: cryptoAddress.addedBy.email,
              }
            : null,
          updatedAt: cryptoAddress.updatedAt,
        },
      },
      "Cryptocurrency address retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle cryptocurrency address status (active/inactive)
// @route   PUT /api/admin/crypto-addresses/:cryptocurrency/toggle-status
// @access  Private/Admin
const toggleCryptoAddressStatus = async (req, res, next) => {
  try {
    const { cryptocurrency } = req.params;

    const cryptoAddress = await CryptoAddress.findOne({ cryptocurrency });

    if (!cryptoAddress) {
      return res.status(404).json({
        success: false,
        message: "Cryptocurrency address not found",
      });
    }

    cryptoAddress.isActive = !cryptoAddress.isActive;
    cryptoAddress.addedBy = req.user.id; // Update who made the change

    await cryptoAddress.save();

    successResponse(
      res,
      {
        cryptoAddress: cryptoAddress.getDisplayInfo(),
      },
      `Cryptocurrency address ${
        cryptoAddress.isActive ? "activated" : "deactivated"
      } successfully`,
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending deposits
// @route   GET /api/admin/transactions/deposits/pending
// @access  Private/Admin
const getPendingDeposits = async (req, res, next) => {
  try {
    const deposits = await Transaction.find({
      type: "deposit",
      status: "pending",
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    const formattedDeposits = deposits.map((deposit) => ({
      id: deposit._id,
      transactionId: deposit.transactionId,
      user: deposit.user
        ? {
            name: `${deposit.user.firstName} ${deposit.user.lastName}`,
            email: deposit.user.email,
          }
        : null,
      cryptocurrency: deposit.cryptocurrency,
      amount: deposit.amount,
      status: deposit.status,
      requestedAt: deposit.createdAt,
      // metadata: deposit.metadata,
    }));

    successResponse(
      res,
      {
        deposits: formattedDeposits,
        count: formattedDeposits.length,
      },
      "Pending deposits retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending withdrawals
// @route   GET /api/admin/transactions/withdrawals/pending
// @access  Private/Admin
const getPendingWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Transaction.find({
      type: "withdrawal",
      status: "pending",
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      id: withdrawal._id,
      transactionId: withdrawal.transactionId,
      user: withdrawal.user
        ? {
            name: `${withdrawal.user.firstName} ${withdrawal.user.lastName}`,
            email: withdrawal.user.email,
          }
        : null,
      cryptocurrency: withdrawal.cryptocurrency,
      amount: withdrawal.amount,
      toAddress: withdrawal.toAddress,
      status: withdrawal.status,
      requestedAt: withdrawal.createdAt,
      // metadata: withdrawal.metadata,
    }));

    successResponse(
      res,
      {
        withdrawals: formattedWithdrawals,
        count: formattedWithdrawals.length,
      },
      "Pending withdrawals retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteUserAccount,
  addOrUpdateCryptoAddress,
  getAllCryptoAddresses,
  getCryptoAddress,
  toggleCryptoAddressStatus,
  getPendingDeposits,
  getPendingWithdrawals,
};
