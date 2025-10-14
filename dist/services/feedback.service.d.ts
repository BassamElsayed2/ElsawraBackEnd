export interface FeedbackFilters {
    page?: number;
    limit?: number;
    min_rating?: number;
    max_rating?: number;
    search?: string;
    branchId?: string;
    rating?: number;
    startDate?: string;
    endDate?: string;
}
export declare class FeedbackService {
    static getFeedback(filters?: FeedbackFilters): Promise<{
        feedback: import("mssql").IRecordSet<any>;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    static getFeedbackAnalytics(filters?: FeedbackFilters): Promise<{
        total_feedback: any;
        average_rating: number;
        average_food_quality: number;
        average_service_quality: number;
        average_delivery_speed: number;
        average_reception_rating: number;
        average_cleanliness_rating: number;
        average_catering_rating: number;
        rating_distribution: {
            5: any;
            4: any;
            3: any;
            2: any;
            1: any;
        };
        rating_breakdown: import("mssql").IRecordSet<any>;
    }>;
    static getFeedbackById(feedbackId: string): Promise<any>;
    static deleteFeedback(feedbackId: string): Promise<{
        message: string;
    }>;
    static updateFeedbackStatus(feedbackId: string, isPublished: boolean): Promise<any>;
    static submitCustomerFeedback(feedbackData: any): Promise<any>;
}
//# sourceMappingURL=feedback.service.d.ts.map