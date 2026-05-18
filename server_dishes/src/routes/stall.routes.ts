import { Router } from "express";
import { getStallById } from "../controllers/stall.controller";

const router = Router();

router.get("/stall/:id", getStallById);

export default router;
