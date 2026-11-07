import { Router } from "express";
import registerUser from "../controllers/user.contollers.js";
import {uplode} from "../middlewares/multter.js"

const router = Router()

router.route("/register").post(
    uplode.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);
// router.route("/register").post(login)

export default router