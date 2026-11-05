import {asynchandler} from "../utils/asynchandler.js"

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
})

export default registerUser 