import {asynchandler} from "../utils/asynchandler.js"
import {apierror} from "../utils/apiError.js"
import {User} from "../models/user_model.js"
import {uplodeoncloudniary} from "../utils/cloudninary.js"
import {apiresponse} from "../utils/apiresponse.js"


//algo for the register user controller so you can reffer this fro revision 

const registerUser = asynchandler(async (req,res)=>{

    // get data thorugh frondend
    //validation of data  - not empty 
    //check if user already exit : user name and email should be unique
    //cjeck ofr images and avtar
    ///uplode them to cloudinary and get the url
    // createuser object - create entry in db 
    //remove password and refresh tocken from the response 
    //check for user creation
    // return the response to frontend with user data and status code 201

    const {fullName, email, username, password} = req.body
    console.log("req.body", req.body);
    console.log("email:", email);


    //validation of data  - not empty

    if(fullName === ""){
        throw new apierror(400, "Full name is required")
    }
    if(email === ""){
        throw new apierror(400, "Email is required")
    }
    if(username === ""){
        throw new apierror(400, "Username is required")
    }
    if(password === ""){
        throw new apierror(400, "Password is required")
    }

    //existance check for user - email and username should be unique

    const userExists = await User.findOne({$or: [{email}, {username}]});

    if(userExists){
        throw new apierror(409, "User with email or username already exists")
    }

    const avatarlocalpath = req.files?.avatar [0]?.path;
    const coverimagelocalpath = req.files?.coverImage?.[0]?.path;
    //check for images and avtar
    //uplode them to cloudinary and get the url

    if(!avatarlocalpath) {
        throw new apierror(400, "Avatar image is required")
    }


    const avatar = await uplodeoncloudniary(avatarlocalpath);
    const coverImage = await uplodeoncloudniary(coverimagelocalpath);

    if(!avatar){
        throw new apierror(500, "Failed to upload avatar image")
    }


    // createuser object - create entry in db

    const user = await User.create({
        fullName,
        email,
        username:tolowerCase(username),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url||""
    })

    // check for user creation
    const  createduser = await  User.findById(user._id).select  ("-password -refreshToken");    
    if(!createduser){
        throw new apierror(500,"something went wrong while creating user")
    }

    // if(!user){
    //     throw new apierror(500, "Failed to create user")
    // }

    // // remove password and refresh tocken from the response
    // user.password = undefined;
    // user.refreshToken = undefined;

    // return the response to frontend with user data and status code 201
    res.status(201).json({
        success: true,
        user
    })
    return res.stauts(201).json(
        new apiresponse(200, createduser, "User created successfully")
    )

})

export default registerUser 