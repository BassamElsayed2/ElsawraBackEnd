import sql from "mssql";
export declare const pool: sql.ConnectionPool;
export declare const connectDB: () => Promise<void>;
export declare const isDatabaseConnected: () => boolean;
export { sql };
//# sourceMappingURL=database.d.ts.map