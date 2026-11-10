import {asynchandler} from "../utils/asynchandler.js"
import { apierror } from "../utils/apierror.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user_model.js"

export const VerifyUserJWT = asynchandler(async (req,res,next)=>{
    try{
        const token = req.cookies?.accessToken || 
    req.headers?.authorization?.replace("Bearer ", "") 
    
    if(!token){
        throw new apierror(401, "Access token is required")

    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            //disuss about frontend  in next_video
            throw new apierror(401, "User not found")
        }
        
        req.user = user;
        next();
    }
    catch(error){
        throw new apierror(401, error?.message || "Invalid access token")
    }   

})