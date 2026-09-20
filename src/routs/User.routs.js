import { Router } from "express";
import registerUser from "../controllers/user.contollers.js";

const router = Router()

router.route("/register").post(registerUser)
// router.route("/register").post(login)

export default router