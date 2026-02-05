import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.js";

// Cookie options for security
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Validation
    if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required. Don't play hard to get.");
    }

    // 2. Check if user already exists
    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists. Try being original.");
    }

    // 3. Create user
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

    // Support both email or username login
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });


    if (!user) {
        throw new ApiError(404, "User does not exist. Did you forget who you are?");
    }

    // Validate password using the method defined in User model
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
        .clearCookie("accessToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out. Ignorance is bliss."));
});

// @desc    Get current user profile (For re-authentication on refresh)
const getCurrentUser = asyncHandler(async (req, res) => {
    // req.user is populated by the verifyJWT middleware
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User profile fetched successfully."));
});

export { registerUser, loginUser, logoutUser, getCurrentUser };