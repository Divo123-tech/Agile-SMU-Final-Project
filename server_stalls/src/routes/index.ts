import { Router } from "express";
import healthRoutes from "./health.routes";
import stallRoutes from "./stall.routes";

const router = Router();

router.use(healthRoutes);
router.use(stallRoutes);

export default router;
