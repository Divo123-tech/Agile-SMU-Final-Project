import { Router } from "express";
import {
  addBookmarkHandler,
  listMyDishesHandler,
  removeBookmarkHandler,
} from "../controllers/bookmark.controller";
import { asAuthHandler, requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/my-dishes", requireAuth, asAuthHandler(listMyDishesHandler));
router.post("/my-dishes/:dishId", requireAuth, asAuthHandler(addBookmarkHandler));
router.delete(
  "/my-dishes/:dishId",
  requireAuth,
  asAuthHandler(removeBookmarkHandler)
);

export default router;
