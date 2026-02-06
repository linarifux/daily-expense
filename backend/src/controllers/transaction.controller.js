import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/Transaction.js";

// @desc    Add a new transaction (linked to the logged-in user)
const addTransaction = asyncHandler(async (req, res) => {
    // 1. Extract 'createdAt' which is what your React Modal sends
    const { title, amount, type, category, note, createdAt } = req.body;

    if ([title, type].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title and Type are required.");
    }

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Amount must be a positive number.");
    }

    // 2. Map 'createdAt' from the frontend to 'date' in the Database
    const transaction = await Transaction.create({
        title,
        amount,
        type,
        category: category || "Uncategorized Chaos",
        note,
        owner: req.user._id,
        // CRITICAL FIX: Explicitly assign the frontend date to the schema 'date' field
        date: createdAt 
    });

    return res.status(201).json(
        new ApiResponse(201, transaction, "Transaction recorded.")
    );
});

// @desc    Get ONLY the logged-in user's transactions + summary stats
const getTransactions = asyncHandler(async (req, res) => {
    // Sort by the 'date' field we just fixed
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
        }, "Data fetched.")
    );
});

// @desc    Delete a specific transaction
const deleteTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const transaction = await Transaction.findOneAndDelete({
        _id: id,
        owner: req.user._id
    });

    if (!transaction) {
        throw new ApiError(404, "Transaction not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Transaction deleted.")
    );
});

export { addTransaction, getTransactions, deleteTransaction };