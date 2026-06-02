import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import {
  createStallHandler,
  deleteStallHandler,
  getMyStallsHandler,
  getStallsHandler,
  getStallByIdHandler,
  getStallMenuHandler,
  updateStallHandler,
} from "../controllers/stall.controller";
import { uploadStallFiles } from "../middleware/upload";

const router = Router();

router.get("/my-stalls/:userId", getMyStallsHandler);

router.get("/stall/:id", getStallMenuHandler);

router.get("/stalls", getStallsHandler);

router.get("/stalls/:id", getStallByIdHandler);

router.put(
  "/stalls/:id",
  (req: Request, res: Response, next: NextFunction) => {
    uploadStallFiles(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      void updateStallHandler(req, res, next);
    });
  }
);

router.delete("/stalls/:id", deleteStallHandler);

router.post(
  "/stalls",
  (req: Request, res: Response, next: NextFunction) => {
    uploadStallFiles(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      void createStallHandler(req, res, next);
    });
  }
);

export default router;
