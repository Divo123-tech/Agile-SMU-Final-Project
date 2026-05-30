import { Router } from "express";
import dishRoutes from "./dish.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use(healthRoutes);
router.use(dishRoutes);

export default router;
