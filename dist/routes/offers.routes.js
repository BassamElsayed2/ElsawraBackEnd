"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const offers_controller_1 = require("../controllers/offers.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", offers_controller_1.OffersController.getAllOffers);
router.get("/:id", offers_controller_1.OffersController.getOfferById);
// Admin routes
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, offers_controller_1.OffersController.createOffer);
router.put("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, offers_controller_1.OffersController.updateOffer);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, offers_controller_1.OffersController.deleteOffer);
exports.default = router;
//# sourceMappingURL=offers.routes.js.map