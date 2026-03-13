"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
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
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use(
  (0, cors_1.default)({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);
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
    database: (0, database_1.isDatabaseConnected)()
      ? "connected"
      : "disconnected",
  });
});
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const categories_routes_1 = __importDefault(
  require("./routes/categories.routes"),
);
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const offers_routes_1 = __importDefault(require("./routes/offers.routes"));
const comboOffers_routes_1 = __importDefault(
  require("./routes/comboOffers.routes"),
);
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const branches_routes_1 = __importDefault(require("./routes/branches.routes"));
const qrcode_routes_1 = __importDefault(require("./routes/qrcode.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const addresses_routes_1 = __importDefault(
  require("./routes/addresses.routes"),
);
const delivery_routes_1 = __importDefault(require("./routes/delivery.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const temp_admin_routes_1 = __importDefault(
  require("./routes/temp-admin.routes"),
);
// Serve uploaded files with CORS
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express_1.default.static("uploads"),
);
// API routes
app.use("/auth", auth_routes_1.default);
app.use("/products", products_routes_1.default);
app.use("/categories", categories_routes_1.default);
app.use("/orders", orders_routes_1.default);
app.use("/offers", offers_routes_1.default);
app.use("/combo-offers", comboOffers_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.use("/upload", upload_routes_1.default);
app.use("/branches", branches_routes_1.default);
app.use("/qrcode", qrcode_routes_1.default);
app.use("/feedback", feedback_routes_1.default);
app.use("/addresses", addresses_routes_1.default);
app.use("/delivery", delivery_routes_1.default);
app.use("/payments", payment_routes_1.default);
app.use("/temp-admin", temp_admin_routes_1.default);
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
// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  logger_1.logger.info(`Server running on 0.0.0.0:${PORT}`);
  logger_1.logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger_1.logger.info(
    `API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`,
  );
});
// Graceful shutdown
process.on("SIGTERM", () => {
  logger_1.logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger_1.logger.info("HTTP server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  logger_1.logger.info("SIGINT signal received: closing HTTP server");
  server.close(() => {
    logger_1.logger.info("HTTP server closed");
    process.exit(0);
  });
});
process.on("uncaughtException", (error) => {
  logger_1.logger.error("Uncaught Exception:", error);
});
process.on("unhandledRejection", (reason) => {
  logger_1.logger.error("Unhandled Rejection:", reason);
});
exports.default = app;
//# sourceMappingURL=index.js.map
