import sql from "mssql";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

const config: sql.config = {
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
export const pool = new sql.ConnectionPool(config);
let isConnected = false;
const RETRY_DELAY_MS = 5000;

// Connect to database
export const connectDB = async (): Promise<void> => {
  try {
    if (pool.connected) {
      isConnected = true;
      return;
    }

    await pool.connect();
    isConnected = true;
    logger.info("Connected to SQL Server database");
  } catch (error) {
    isConnected = false;
    logger.error("Failed to connect to SQL Server. Retrying in 5s...", error);
    setTimeout(() => {
      void connectDB();
    }, RETRY_DELAY_MS);
  }
};

// Initialize connection
void connectDB();

export const isDatabaseConnected = (): boolean => isConnected;

// Export sql for raw queries
export { sql };
