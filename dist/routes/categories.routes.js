"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_controller_1 = require("../controllers/categories.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const categories_validators_1 = require("../validators/categories.validators");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Public routes
router.get("/", (0, validation_middleware_1.validateQuery)(categories_validators_1.getCategoriesQuerySchema), categories_controller_1.CategoriesController.getCategories);
router.get("/:id", (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), categories_controller_1.CategoriesController.getCategoryById);
// Admin routes
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateBody)(categories_validators_1.createCategorySchema), categories_controller_1.CategoriesController.createCategory);
router.put("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(categories_validators_1.updateCategorySchema), categories_controller_1.CategoriesController.updateCategory);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), categories_controller_1.CategoriesController.deleteCategory);
exports.default = router;
//# sourceMappingURL=categories.routes.js.map