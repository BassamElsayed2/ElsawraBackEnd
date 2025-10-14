"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackController = void 0;
const feedback_service_1 = require("../services/feedback.service");
const error_middleware_1 = require("../middleware/error.middleware");
class FeedbackController {
}
exports.FeedbackController = FeedbackController;
_a = FeedbackController;
// Get all feedback with filters
FeedbackController.getFeedback = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { page, limit, min_rating, max_rating, search, branchId, rating, startDate, endDate, } = req.query;
    const filters = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        min_rating: min_rating ? parseInt(min_rating) : undefined,
        max_rating: max_rating ? parseInt(max_rating) : undefined,
        rating: rating ? parseInt(rating) : undefined,
        search,
        branchId,
        startDate,
        endDate,
    };
    const result = await feedback_service_1.FeedbackService.getFeedback(filters);
    res.json({
        success: true,
        data: result,
    });
});
// Get feedback analytics
FeedbackController.getFeedbackAnalytics = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { branchId, startDate, endDate } = req.query;
    const filters = {
        branchId,
        startDate,
        endDate,
    };
    const analytics = await feedback_service_1.FeedbackService.getFeedbackAnalytics(filters);
    res.json({
        success: true,
        data: analytics,
    });
});
// Get feedback by ID
FeedbackController.getFeedbackById = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const feedback = await feedback_service_1.FeedbackService.getFeedbackById(id);
    res.json({
        success: true,
        data: { feedback },
    });
});
// Delete feedback
FeedbackController.deleteFeedback = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const result = await feedback_service_1.FeedbackService.deleteFeedback(id);
    res.json({
        success: true,
        message: result.message,
    });
});
// Update feedback published status
FeedbackController.updateFeedbackStatus = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { is_published } = req.body;
    const feedback = await feedback_service_1.FeedbackService.updateFeedbackStatus(id, is_published);
    res.json({
        success: true,
        message: "Feedback status updated successfully",
        data: { feedback },
    });
});
// Submit feedback from customer (public endpoint - no auth required)
FeedbackController.submitFeedback = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const feedbackData = req.body;
    const feedback = await feedback_service_1.FeedbackService.submitCustomerFeedback(feedbackData);
    res.status(201).json({
        success: true,
        message: "تم إرسال تقييمك بنجاح، شكراً لك!",
        data: { feedback },
    });
});
//# sourceMappingURL=feedback.controller.js.map