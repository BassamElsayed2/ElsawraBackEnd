"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.isDatabaseConnected = exports.connectDB = exports.pool = void 0;
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
        connectTimeout: 30000,
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
let isConnected = false;
const RETRY_DELAY_MS = 5000;
// Connect to database
const connectDB = async () => {
    try {
        if (exports.pool.connected) {
            isConnected = true;
            return;
        }
        await exports.pool.connect();
        isConnected = true;
        logger_1.logger.info("Connected to SQL Server database");
    }
    catch (error) {
        isConnected = false;
        logger_1.logger.error("Failed to connect to SQL Server. Retrying in 5s...", error);
        setTimeout(() => {
            void (0, exports.connectDB)();
        }, RETRY_DELAY_MS);
    }
};
exports.connectDB = connectDB;
// Initialize connection
void (0, exports.connectDB)();
const isDatabaseConnected = () => isConnected;
exports.isDatabaseConnected = isDatabaseConnected;
//# sourceMappingURL=database.js.map