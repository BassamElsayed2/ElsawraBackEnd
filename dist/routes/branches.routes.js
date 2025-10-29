"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const branches_controller_1 = require("../controllers/branches.controller");
const branch_products_controller_1 = require("../controllers/branch-products.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const zod_1 = require("zod");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get("/", branches_controller_1.branchesController.getAllBranches);
router.get("/:id", branches_controller_1.branchesController.getBranchById);
// Protected routes (admin only)
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, branches_controller_1.branchesController.createBranch);
router.put("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, branches_controller_1.branchesController.updateBranch);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, branches_controller_1.branchesController.deleteBranch);
// ============================================
// BRANCH-PRODUCTS AND BRANCH-CATEGORIES
// ============================================
// Get all products in a branch
router.get("/:branchId/products", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ branchId: zod_1.z.string().uuid() })), branch_products_controller_1.BranchProductsController.getBranchProducts);
// Get all categories in a branch
router.get("/:branchId/categories", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ branchId: zod_1.z.string().uuid() })), branch_products_controller_1.BranchProductsController.getBranchCategories);
exports.default = router;
//# sourceMappingURL=branches.routes.js.map