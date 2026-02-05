import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import { ApiError } from "./src/utils/ApiError.js";

// Route imports
import transactionRouter from "./src/routes/transaction.routes.js";
import userRouter from "./src/routes/user.routes.js";

// Load env vars
dotenv.config({ path: "./.env" });

const server = express();

// --- 1. Global Middleware ---
server.use(cors({
    origin: ["http://localhost:5173", "https://track-expense-daily.netlify.app", "https://daily-expense-tau.vercel.app"], 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

server.use(cookieParser());
server.use(express.json({ limit: "16kb" }));
server.use(express.urlencoded({ extended: true, limit: "16kb" }));

// --- 2. Database Connection ---
connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(` 🚀 Server is sprinting at port: ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed !!! ", err);
    });

// --- 3. Routes (MUST come BEFORE Error Handler) ---
server.get("/", (req, res) => {
    res.status(200).json({ message: "System online. Wallet currently crying." });
});

server.use("/api/v1/transactions", transactionRouter);
server.use("/api/v1/users", userRouter);

// --- 4. Custom Global Error Handler (MUST come LAST) ---
// This acts as the final safety net for all routes above it.
server.use((err, req, res, next) => {
    // If it's a known ApiError, use its status code and message
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message, // This is the "humorous" message you want
            errors: err.errors,
        });
    }

    // Default for unknown errors (like DB crashes or syntax errors)
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error: The server is having a mid-life crisis.";

    return res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === "development" ? err.stack : null,
    });
});