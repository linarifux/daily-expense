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

// TRUST PROXY: Critical for Vercel to correctly identify 'secure' cookies
server.set("trust proxy", 1);

server.use(cors({
    // Only include the exact origins needed to keep the header size small
    origin: [
        "http://localhost:5173", 
        "https://track-expense-daily.netlify.app"
    ], 
    credentials: true, // Required to allow cookies to be sent/received
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

server.use(cookieParser());
server.use(express.json({ limit: "16kb" }));
server.use(express.urlencoded({ extended: true, limit: "16kb" }));

// --- 2. Database Connection ---
connectDB()
    .then(() => {
        if (process.env.NODE_ENV !== 'production') {
            server.listen(process.env.PORT || 8000, () => {
                console.log(` 🚀 Server is sprinting at port: ${process.env.PORT || 8000}`);
            });
        }
    })
    .catch((err) => {
        console.error("MongoDB connection failed !!! ", err);
    });

// --- 3. Routes ---
server.get("/", (req, res) => {
    res.status(200).json({ 
        message: "System online. Wallet currently crying.",
        deployment: "Vercel Serverless Production"
    });
});

server.use("/api/v1/transactions", transactionRouter);
server.use("/api/v1/users", userRouter);

// --- 4. Custom Global Error Handler ---
server.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error: The server is having a mid-life crisis.";

    return res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === "development" ? err.stack : null,
    });
});

export default server;