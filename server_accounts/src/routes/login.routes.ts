import { Router } from "express";
import { loginHandler } from "../controllers/login.controller";

const router = Router();

router.post("/login", loginHandler);

export default router;
