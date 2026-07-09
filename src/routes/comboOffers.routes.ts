import { Router } from "express";
import { ComboOffersController } from "../controllers/comboOffers.controller";
import { customerAuthMiddleware, dashboardAuthMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", ComboOffersController.getAllComboOffers);
router.get("/:id", ComboOffersController.getComboOfferById);

// Admin routes
router.post(
  "/",
  dashboardAuthMiddleware,
  ComboOffersController.createComboOffer
);
router.put(
  "/:id",
  dashboardAuthMiddleware,
  ComboOffersController.updateComboOffer
);
router.delete(
  "/:id",
  dashboardAuthMiddleware,
  ComboOffersController.deleteComboOffer
);

export default router;
