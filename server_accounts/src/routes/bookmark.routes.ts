import { Router } from "express";
import {
  addBookmarkHandler,
  listMyDishesHandler,
  removeBookmarkHandler,
} from "../controllers/bookmark.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/my-dishes", requireAuth, listMyDishesHandler);
router.post("/my-dishes/:dishId", requireAuth, addBookmarkHandler);
router.delete("/my-dishes/:dishId", requireAuth, removeBookmarkHandler);

export default router;
