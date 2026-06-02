import { Router } from "express";
import {
  getAccountHandler,
  updateAccountHandler,
} from "../controllers/account.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/account", requireAuth, getAccountHandler);
router.patch("/account", requireAuth, updateAccountHandler);

export default router;
