import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/Transaction.js";

// @desc    Add a new transaction (linked to the logged-in user)
const addTransaction = asyncHandler(async (req, res) => {
    const { title, amount, type, category, note } = req.body;

    // Validation
    if ([title, type].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title and Type are required. Stop being mysterious.");
    }

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Amount must be a positive number. No magic money here.");
    }

    // Create transaction with owner ID from req.user (set by verifyJWT)
    const transaction = await Transaction.create({
        title,
        amount,
        type,
        category: category || "Uncategorized Chaos",
        note,
        owner: req.user._id 
    });

    return res.status(201).json(
        new ApiResponse(201, transaction, "Transaction recorded. RIP your wallet.")
    );
});

// @desc    Get ONLY the logged-in user's transactions + summary stats
const getTransactions = asyncHandler(async (req, res) => {
    // Crucial: Filter by owner!
    const transactions = await Transaction.find({ owner: req.user._id }).sort({ date: -1 });

    const totals = transactions.reduce((acc, item) => {
        if (item.type === 'income') acc.income += item.amount;
        else acc.expense += item.amount;
        return acc;
    }, { income: 0, expense: 0 });

    const balance = totals.income - totals.expense;

    return res.status(200).json(
        new ApiResponse(200, {
            transactions,
            stats: { ...totals, balance }
        }, "Data fetched. The numbers don't lie, but they might hurt.")
    );
});

// @desc    Delete a specific transaction
const deleteTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Ensure the transaction exists AND belongs to the user before deleting
    const transaction = await Transaction.findOneAndDelete({
        _id: id,
        owner: req.user._id
    });

    if (!transaction) {
        throw new ApiError(404, "Transaction not found or you don't have permission to delete it.");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Transaction deleted. History rewritten, just like that.")
    );
});

export { addTransaction, getTransactions, deleteTransaction };