import { Router } from "express";
import {
  createDishHandler,
  deleteDishHandler,
  getDishByIdHandler,
  updateDishHandler,
} from "../controllers/dish.controller";

const router = Router();

router.get("/dishes/:id", getDishByIdHandler);
router.put("/dishes/:id", updateDishHandler);
router.delete("/dishes/:id", deleteDishHandler);
router.post("/dishes", createDishHandler);

export default router;
