import { Router } from "express";
import {
  getPendingStallHandler,
  getPendingStallMenuHandler,
  listPendingStallsHandler,
  reviewStallHandler,
} from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/requireAdmin";
import { asAuthHandler, requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get(
  "/admin/stalls/pending",
  requireAuth,
  asAuthHandler(requireAdmin),
  asAuthHandler(listPendingStallsHandler)
);

router.get(
  "/admin/stalls/:id/menu",
  requireAuth,
  asAuthHandler(requireAdmin),
  asAuthHandler(getPendingStallMenuHandler)
);

router.get(
  "/admin/stalls/:id",
  requireAuth,
  asAuthHandler(requireAdmin),
  asAuthHandler(getPendingStallHandler)
);

router.patch(
  "/admin/stalls/:id/status",
  requireAuth,
  asAuthHandler(requireAdmin),
  asAuthHandler(reviewStallHandler)
);

export default router;
