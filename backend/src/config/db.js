import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        
        console.log(`\n ✅ MongoDB connected! Host: ${connectionInstance.connection.host}`);
        console.log(` 💸 Tracker is ready to judge your spending.`);
    } catch (error) {
        console.error(" ❌ MONGODB connection FAILED: ", error);
        // Exit process with failure
        process.exit(1);
    }
};

export default connectDB;