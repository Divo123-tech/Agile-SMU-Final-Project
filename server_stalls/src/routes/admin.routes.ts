import { Router } from "express";
import {
  getPendingStallHandler,
  getPendingStallMenuHandler,
  listPendingStallsHandler,
  reviewStallHandler,
} from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get(
  "/admin/stalls/pending",
  requireAuth,
  requireAdmin,
  listPendingStallsHandler
);

router.get(
  "/admin/stalls/:id/menu",
  requireAuth,
  requireAdmin,
  getPendingStallMenuHandler
);

router.get(
  "/admin/stalls/:id",
  requireAuth,
  requireAdmin,
  getPendingStallHandler
);

router.patch(
  "/admin/stalls/:id/status",
  requireAuth,
  requireAdmin,
  reviewStallHandler
);

export default router;
