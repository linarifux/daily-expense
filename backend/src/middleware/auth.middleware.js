import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "./asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "No token, no entry. Log in first!");

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password");

        if (!user) throw new ApiError(401, "User not found. Are you a ghost?");
        
        req.user = user;
        next();
    } catch (error) {
        // Distinguish between expired and tampered tokens
        const message = error.name === "TokenExpiredError" 
            ? "Session expired. Time to re-log." 
            : "Invalid token. Stop trying to hack yourself.";
        throw new ApiError(401, message);
    }
});