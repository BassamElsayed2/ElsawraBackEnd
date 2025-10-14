import express from "express";
import { branchesController } from "../controllers/branches.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes (no authentication required)
router.get("/", branchesController.getAllBranches);
router.get("/:id", branchesController.getBranchById);

// Protected routes (admin only)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  branchesController.createBranch
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  branchesController.updateBranch
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  branchesController.deleteBranch
);

export default router;
