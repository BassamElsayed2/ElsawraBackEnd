"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.connectDB = exports.pool = void 0;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
const config = {
    server: process.env.DB_SERVER || "localhost",
    database: process.env.DB_NAME || "elsawraDb",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "1433"),
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};
// Create connection pool
exports.pool = new mssql_1.default.ConnectionPool(config);
// Connect to database
const connectDB = async () => {
    try {
        await exports.pool.connect();
        logger_1.logger.info("✅ Connected to SQL Server database");
    }
    catch (error) {
        logger_1.logger.error("❌ Failed to connect to SQL Server:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
// Initialize connection
(0, exports.connectDB)();
//# sourceMappingURL=database.js.map