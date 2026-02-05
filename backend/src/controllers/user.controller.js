import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.js";

// UPDATED: Production-ready cookie options for Netlify -> Vercel communication
const cookieOptions = {
    httpOnly: true,
    // MUST be true in production to allow sameSite: "None"
    secure: true, 
    // MUST be "None" for cross-origin domains (Netlify to Vercel)
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: "/",
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required. Don't play hard to get.");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists. Try being original.");
    }

    const user = await User.create({ username, email, password });
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering. The server is feeling shy.");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully. Welcome to the broke club!")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist. Did you forget who you are?");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials. Nice try, hacker.");
    }

    const accessToken = user.generateAccessToken();
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions) 
        .json(
            new ApiResponse(
                200, 
                { user: loggedInUser, accessToken }, 
                "Logged in successfully. Time to face your financial reality."
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        // Ensure options match for the browser to successfully clear the cookie
        .clearCookie("accessToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out. Ignorance is bliss."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User profile fetched successfully."));
});

export { registerUser, loginUser, logoutUser, getCurrentUser };