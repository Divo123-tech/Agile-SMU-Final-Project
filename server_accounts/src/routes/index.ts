import { Router } from "express";
import healthRoutes from "./health.routes";
import loginRoutes from "./login.routes";
import signUpRoutes from "./signUp.routes";

const router = Router();

router.use(healthRoutes);
router.use(signUpRoutes);
router.use(loginRoutes);

export default router;
