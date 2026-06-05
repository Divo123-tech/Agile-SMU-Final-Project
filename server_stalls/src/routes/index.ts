import { Router } from "express";
import adminRoutes from "./admin.routes";
import healthRoutes from "./health.routes";
import stallRoutes from "./stall.routes";

const router = Router();

router.use(healthRoutes);
router.use(stallRoutes);
router.use(adminRoutes);

export default router;
