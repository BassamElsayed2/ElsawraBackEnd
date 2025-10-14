"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comboOffers_controller_1 = require("../controllers/comboOffers.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", comboOffers_controller_1.ComboOffersController.getAllComboOffers);
router.get("/:id", comboOffers_controller_1.ComboOffersController.getComboOfferById);
// Admin routes
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, comboOffers_controller_1.ComboOffersController.createComboOffer);
router.put("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, comboOffers_controller_1.ComboOffersController.updateComboOffer);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, comboOffers_controller_1.ComboOffersController.deleteComboOffer);
exports.default = router;
//# sourceMappingURL=comboOffers.routes.js.map