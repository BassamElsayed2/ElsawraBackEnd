"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const branches_controller_1 = require("../controllers/branches.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get("/", branches_controller_1.branchesController.getAllBranches);
router.get("/:id", branches_controller_1.branchesController.getBranchById);
// Protected routes (admin only)
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, branches_controller_1.branchesController.createBranch);
router.put("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, branches_controller_1.branchesController.updateBranch);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, branches_controller_1.branchesController.deleteBranch);
exports.default = router;
//# sourceMappingURL=branches.routes.js.map