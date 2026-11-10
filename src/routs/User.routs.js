import { Router } from "express";
import { registerUser, loginUser, loggOutUser }  from "../controllers/user.contollers.js";
import {uplode} from "../middlewares/multter.js"
import  {VerifyUserJWT}  from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    uplode.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser)

//secured routes 
router.route("/logout").post(VerifyUserJWT, loggOutUser)


export default router