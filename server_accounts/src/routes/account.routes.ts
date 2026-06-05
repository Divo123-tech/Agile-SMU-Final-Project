import { Router } from "express";
import {
  getAccountHandler,
  updateAccountHandler,
} from "../controllers/account.controller";
import { asAuthHandler, requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/account", requireAuth, asAuthHandler(getAccountHandler));
router.patch("/account", requireAuth, asAuthHandler(updateAccountHandler));

export default router;
