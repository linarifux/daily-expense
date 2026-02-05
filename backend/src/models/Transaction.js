// backend/src/models/Transaction.js
import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: [true, "What did you buy? Don't lie to me."],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, "How much did this mistake cost?"],
        },
        type: {
            type: String,
            enum: ["expense", "income"],
            required: true,
        },
        category: {
            type: String,
            default: "Misc",
            trim: true,
        },
        note: {
            type: String,
            maxLength: [100, "Keep the sob story short."],
        },
        date: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);