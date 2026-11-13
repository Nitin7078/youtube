import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user_model.js";

export const VerifyUserJWT = asynchandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace(/^Bearer\s+/i, "");

        if (!token) {
            throw new apierror(401, "Unauthorized request: Access token is required");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new apierror(401, "Invalid Access Token: User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new apierror(401, error?.message || "Invalid access token");
    }
});

export const verifyJWT = VerifyUserJWT;
