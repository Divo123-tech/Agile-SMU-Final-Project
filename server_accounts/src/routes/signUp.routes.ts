import { Router } from "express";
import { signUpHandler } from "../controllers/signUp.controller";

const router = Router();

router.post("/sign-up", signUpHandler);

export default router;
