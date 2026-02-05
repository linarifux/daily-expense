import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "./asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    // 1. Try to extract token from Cookies OR Authorization Header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "No token, no entry. Log in first!");
    }

    try {
        // 2. Verify the token using your secret
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 3. Find the user and exclude sensitive fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "User not found. Are you a ghost?");
        }
        
        // 4. Attach user to request object for use in controllers
        req.user = user;
        next();
    } catch (error) {
        // Distinguish between expired and tampered tokens for better UX
        let message = "Invalid token. Stop trying to hack yourself.";
        
        if (error.name === "TokenExpiredError") {
            message = "Session expired. Time to log back in.";
        }

        throw new ApiError(401, message);
    }
});