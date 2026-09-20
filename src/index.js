// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("DB connection failed", error);
  });

// import express from "express"
// const app = express()
// ;(async()=>{
// try{
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error",(error)=>{
//         console.log("Error : ",error);
//         throw error
//     })

//     app.listen(process.env.PORT,()=>{
//         console.log(`app is listing at ${process.env.PORT}`);
//     })
// }catch(error){
//     console.error("Error" ,error)
//     throw error
// }
// })()
