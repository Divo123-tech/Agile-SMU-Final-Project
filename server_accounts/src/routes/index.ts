import { Router } from "express";
import accountRoutes from "./account.routes";
import healthRoutes from "./health.routes";
import loginRoutes from "./login.routes";
import signUpRoutes from "./signUp.routes";

const router = Router();

router.use(healthRoutes);
router.use(signUpRoutes);
router.use(loginRoutes);
router.use(accountRoutes);

export default router;
