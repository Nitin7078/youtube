import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { User } from "../models/user_model.js";
import { uplodeoncloudniary } from "../utils/cloudninary.js";
import { apiresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new apierror(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (err) {
        console.error("Token generation error:", err);
        throw new apierror(500, "Failed to generate access token and refresh token");
    }
};

const registerUser = asynchandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    // validation of data - not empty/undefined/whitespace
    if (!fullName || fullName.trim() === "") {
        throw new apierror(400, "Full name is required");
    }
    if (!email || email.trim() === "") {
        throw new apierror(400, "Email is required");
    }
    if (!username || username.trim() === "") {
        throw new apierror(400, "Username is required");
    }
    if (!password || password.trim() === "") {
        throw new apierror(400, "Password is required");
    }

    // existence check for user - email and username should be unique
    const userExists = await User.findOne({
        $or: [
            { email: email.trim().toLowerCase() },
            { username: username.trim().toLowerCase() }
        ]
    });

    if (userExists) {
        throw new apierror(409, "User with email or username already exists");
    }

    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverimagelocalpath = req.files?.coverImage?.[0]?.path;

    if (!avatarlocalpath) {
        throw new apierror(400, "Avatar image is required");
    }

    const avatar = await uplodeoncloudniary(avatarlocalpath);
    let coverImage = "";
    if (coverimagelocalpath) {
        const uploadedCover = await uplodeoncloudniary(coverimagelocalpath);
        coverImage = uploadedCover?.url || "";
    }

    if (!avatar) {
        throw new apierror(500, "Failed to upload avatar image");
    }

    const user = await User.create({
        fullname: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new apierror(500, "Something went wrong while creating user");
    }

    return res.status(201).json(
        new apiresponse(201, createdUser, "User created successfully")
    );
});

const loginUser = asynchandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new apierror(400, "Username or email is required");
    }

    if (!password) {
        throw new apierror(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [
            ...(username ? [{ username: username.trim().toLowerCase() }] : []),
            ...(email ? [{ email: email.trim().toLowerCase() }] : [])
        ]
    });

    if (!user) {
        throw new apierror(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apierror(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiresponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

const loggOutUser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // properly remove refreshToken from document
            }
        },
        {
            returnDocument: 'after' 
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiresponse(200, {}, "User logged out successfully this one ")
        );
});

//this refresh tocken generator is used to generate new access token and refresh 
// token when the old access token expires. The refresh token is stored in the database and 
// is used to verify the user when they request a new access token. If the refresh token is valid, 
// a new access token and refresh token are generated and sent back to the user. 
// If the refresh token is invalid or expired, an error is thrown.
//simple prev token is equal to the tocken in the data base than genetrate the new access token and refresh token
//  and send it back to the user.

const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new apierror(401, "Unauthorized request: Refresh token is required");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new apierror(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apierror(401, "Refresh token is expired or already used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessTokenAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiresponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new apierror(401, error?.message || "Invalid refresh token");
    }
});



export {
    registerUser,
    loginUser,
    loggOutUser,
    refreshAccessToken
};
