"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controller_1 = require("../controllers/products.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const products_validators_1 = require("../validators/products.validators");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Public routes
router.get("/", (0, validation_middleware_1.validateQuery)(products_validators_1.getProductsQuerySchema), products_controller_1.ProductsController.getProducts);
router.get("/:id", (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), products_controller_1.ProductsController.getProductById);
// Admin routes
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateBody)(products_validators_1.createProductSchema), products_controller_1.ProductsController.createProduct);
router.put("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(products_validators_1.updateProductSchema), products_controller_1.ProductsController.updateProduct);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), products_controller_1.ProductsController.deleteProduct);
exports.default = router;
//# sourceMappingURL=products.routes.js.map