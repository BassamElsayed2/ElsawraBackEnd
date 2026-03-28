"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const uploads_1 = require("./config/uploads");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 4015;
// Security middleware
app.use((0, helmet_1.default)());
// CORS: allow main app URLs + optional extra origins (preview deploys, www vs non-www)
function getCorsOrigin() {
    const fromEnv = [
        process.env.FRONTEND_URL,
        process.env.DASHBOARD_URL,
        ...(process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ||
            []),
    ].filter((x) => !!x);
    const unique = [...new Set(fromEnv)];
    return unique.length ? unique : true;
}
// CORS configuration
app.use((0, cors_1.default)({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
// Request logging
app.use((req, _res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("user-agent"),
    });
    next();
});
// Health check endpoint
app.get("/health", async (_req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: (0, database_1.isDatabaseConnected)() ? "connected" : "disconnected",
    });
});
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const categories_routes_1 = __importDefault(require("./routes/categories.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const offers_routes_1 = __importDefault(require("./routes/offers.routes"));
const comboOffers_routes_1 = __importDefault(require("./routes/comboOffers.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const branches_routes_1 = __importDefault(require("./routes/branches.routes"));
const qrcode_routes_1 = __importDefault(require("./routes/qrcode.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const addresses_routes_1 = __importDefault(require("./routes/addresses.routes"));
const delivery_routes_1 = __importDefault(require("./routes/delivery.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const temp_admin_routes_1 = __importDefault(require("./routes/temp-admin.routes"));
// Serve uploaded files with CORS
app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express_1.default.static((0, uploads_1.getUploadsDir)()));
// API routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/products", products_routes_1.default);
app.use("/api/categories", categories_routes_1.default);
app.use("/api/orders", orders_routes_1.default);
app.use("/api/offers", offers_routes_1.default);
app.use("/api/combo-offers", comboOffers_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
app.use("/api/branches", branches_routes_1.default);
app.use("/api/qrcode", qrcode_routes_1.default);
app.use("/api/feedback", feedback_routes_1.default);
app.use("/api/addresses", addresses_routes_1.default);
app.use("/api/delivery", delivery_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/temp-admin", temp_admin_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path,
    });
});
// Error handling middleware (must be last)
app.use(error_middleware_1.errorHandler);
// Start server (ensure uploads dir exists for empty volumes / first run)
void (0, uploads_1.ensureUploadsRootExists)().then(() => {
    const server = app.listen(PORT, "0.0.0.0", () => {
        logger_1.logger.info(`Server running on 0.0.0.0:${PORT}`);
        logger_1.logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger_1.logger.info(`Uploads directory: ${(0, uploads_1.getUploadsDir)()}`);
        logger_1.logger.info(`API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
    });
    process.on("SIGTERM", () => shutdown(server, "SIGTERM signal received"));
    process.on("SIGINT", () => shutdown(server, "SIGINT signal received"));
    function shutdown(s, label) {
        logger_1.logger.info(`${label}: closing HTTP server`);
        s.close(() => {
            logger_1.logger.info("HTTP server closed");
            process.exit(0);
        });
    }
}).catch((err) => {
    logger_1.logger.error("Failed to create uploads directory:", err);
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    logger_1.logger.error("Uncaught Exception:", error);
});
process.on("unhandledRejection", (reason) => {
    logger_1.logger.error("Unhandled Rejection:", reason);
});
exports.default = app;
//# sourceMappingURL=index.js.map