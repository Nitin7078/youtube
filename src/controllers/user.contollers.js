import {asynchandler} from "../utils/asynchandler.js"
import {apierror} from "../utils/apierror.js"
import {User} from "../models/user_model.js"
import {uplodeoncloudniary} from "../utils/cloudninary.js"
import {apiresponse} from "../utils/apiresponse.js"



const generateAccessTokenAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        if(!user){
            throw new apierror(404, "User not found")
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });


        return { accessToken, refreshToken };
    }
    catch(err){
        throw new apierror(500, "Failed to generate access token and refresh token")
    }
}

//algo for the register user controller so you can reffer this for revision 

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

    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverimagelocalpath = req.files?.coverImage?.[0]?.path;

    // let coverimagelocalpath ;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverimagelocalpath = req.files.coverImage[0].path;
    // }
            
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
        fullname: fullName,
        email,
        username: username.toLowerCase(),
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
    
    return res.status(201).json(
        new apiresponse(201, createduser, "User created successfully")
    )

})

const loginUser = asynchandler(async (req,res)=>{
    //req.body se daqta le leoo
    //usernmae oe email and password from req.bod
    //find the useer
    //check the username and password 
    //if matched create access tocken and refresh token
    //save the refresh tocken and send the access tocken to the forntend 
    //send using cookie and send the access tocken in the response body

    const {username, password , email} = req.body;

    if(!username || !email){
        throw new apierror(400, "Username or email is required")
    }

    const user = await User.findOne({$or: [{username}, {email}]});

    if(!user){
        throw new apierror(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new apierror(401, "Invalid password")
    }


    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    //send cookies to frontend 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    

    const option ={
        httpOnly: true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, option)
    .cookie("accessToken", accessToken, option)
    .json(
        new apiresponse(200, {user: loggedInUser, accessToken}, "User logged in successfully")
    )

})


const loggOutUser = asynchandler(async (req,res)=>{

    //how can you log out we dont have any email or username for now ?

    //find user
    //remove refresh tockon from db 

    await User.findByIdAndUpdate(req.user._id , 
        {
            $set : {
                refreshToken: undefined
            }
        },
        {
            new :true 
        }
    )


    const option ={
        httpOnly: true,
        secure:true,
    }
    return res 
    .status(200)
    .clearCookie("refreshToken", option)
    .clearCookie("accessToken", option)
    .json(
        new apiresponse(200, null, "User logged out successfully")
    )
})

export { registerUser, loginUser, loggOutUser } 