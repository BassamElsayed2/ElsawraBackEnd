import http from "http";
import fs from "fs/promises";
import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error.middleware";
import { logger } from "./utils/logger";
import { isDatabaseConnected } from "./config/database";
import { ensureUploadsRootExists, getUploadsDir } from "./config/uploads";
import { initSocket } from "./socket";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 4015;

// Security middleware
app.use(helmet());

// CORS: allow main app URLs + optional extra origins (preview deploys, www vs non-www)
function getCorsOrigin(): string | string[] | boolean {
  const fromEnv = [
    process.env.FRONTEND_URL,
    process.env.DASHBOARD_URL,
    ...(process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ||
      []),
  ].filter((x): x is string => !!x);
  const unique = [...new Set(fromEnv)];
  return unique.length ? unique : true;
}

// CORS configuration
app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Health check endpoint (includes uploads diagnostics for Coolify volume checks)
app.get("/health", async (_req: Request, res: Response) => {
  const uploadsDir = getUploadsDir();
  let uploadsExists = false;
  let uploadsEntries = 0;
  try {
    const stat = await fs.stat(uploadsDir);
    uploadsExists = stat.isDirectory();
    if (uploadsExists) {
      const entries = await fs.readdir(uploadsDir);
      uploadsEntries = entries.length;
    }
  } catch {
    uploadsExists = false;
  }

  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: isDatabaseConnected() ? "connected" : "disconnected",
    uploads: {
      dir: uploadsDir,
      exists: uploadsExists,
      topLevelEntries: uploadsEntries,
    },
  });
});

// Import routes
import authRoutes from "./routes/auth.routes";
import dashboardAuthRoutes from "./routes/dashboard-auth.routes";
import productsRoutes from "./routes/products.routes";
import categoriesRoutes from "./routes/categories.routes";
import ordersRoutes from "./routes/orders.routes";
import comboOffersRoutes from "./routes/comboOffers.routes";
import adminRoutes from "./routes/admin.routes";
import uploadRoutes from "./routes/upload.routes";

import branchesRoutes from "./routes/branches.routes";
import qrcodeRoutes from "./routes/qrcode.routes";
import feedbackRoutes from "./routes/feedback.routes";
import addressesRoutes from "./routes/addresses.routes";
import deliveryRoutes from "./routes/delivery.routes";
import paymentRoutes from "./routes/payment.routes";

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
  express.static(getUploadsDir()),
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard/auth", dashboardAuthRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/combo-offers", comboOffersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/qrcode", qrcodeRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/payments", paymentRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (ensure uploads dir exists for empty volumes / first run)
void ensureUploadsRootExists().then(() => {
  const httpServer = http.createServer(app);
  initSocket(httpServer, getCorsOrigin());

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on 0.0.0.0:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Uploads directory: ${getUploadsDir()}`);
    logger.info(`API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
    logger.info("WebSocket enabled at /socket.io");
  });

  process.on("SIGTERM", () => shutdown(httpServer, "SIGTERM signal received"));
  process.on("SIGINT", () => shutdown(httpServer, "SIGINT signal received"));

  function shutdown(s: typeof httpServer, label: string) {
    logger.info(`${label}: closing HTTP server`);
    s.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  }
}).catch((err) => {
  logger.error("Failed to create uploads directory:", err);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

export default app;
