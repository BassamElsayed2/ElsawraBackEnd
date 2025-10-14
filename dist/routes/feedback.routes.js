"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedback_controller_1 = require("../controllers/feedback.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Submit feedback schema (for customer submissions - no auth required)
const submitFeedbackSchema = zod_1.z.object({
    branch_id: zod_1.z.string().uuid(),
    customer_name: zod_1.z.string().min(1),
    phone_number: zod_1.z.string().min(8),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    overall_rating: zod_1.z.number().min(1).max(4),
    reception_rating: zod_1.z.number().min(0).max(4).optional(),
    service_speed_rating: zod_1.z.number().min(0).max(4).optional(),
    quality_rating: zod_1.z.number().min(0).max(4).optional(),
    cleanliness_rating: zod_1.z.number().min(0).max(4).optional(),
    catering_rating: zod_1.z.number().min(0).max(4).optional(),
    opinion: zod_1.z.string().optional().or(zod_1.z.literal("")),
});
// Query schema for filtering
const feedbackQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    min_rating: zod_1.z.string().optional(),
    max_rating: zod_1.z.string().optional(),
    rating: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    branchId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
// Analytics query schema
const analyticsQuerySchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
// Update status schema
const updateStatusSchema = zod_1.z.object({
    is_published: zod_1.z.boolean(),
});
// Public routes (no auth required)
router.post("/submit", (0, validation_middleware_1.validateBody)(submitFeedbackSchema), feedback_controller_1.FeedbackController.submitFeedback);
// Admin routes
router.get("/", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateQuery)(feedbackQuerySchema), feedback_controller_1.FeedbackController.getFeedback);
router.get("/analytics", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateQuery)(analyticsQuerySchema), feedback_controller_1.FeedbackController.getFeedbackAnalytics);
router.get("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), feedback_controller_1.FeedbackController.getFeedbackById);
router.delete("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), feedback_controller_1.FeedbackController.deleteFeedback);
router.patch("/:id/status", auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, (0, validation_middleware_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid() })), (0, validation_middleware_1.validateBody)(updateStatusSchema), feedback_controller_1.FeedbackController.updateFeedbackStatus);
exports.default = router;
//# sourceMappingURL=feedback.routes.js.map