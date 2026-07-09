import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { logger } from "../utils/logger";

let io: Server | null = null;

export function initSocket(
  httpServer: HttpServer,
  corsOrigin: string | string[] | boolean
): Server {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.join("dashboard");
    logger.info("Dashboard socket connected", { socketId: socket.id });

    socket.on("disconnect", (reason) => {
      logger.info("Dashboard socket disconnected", {
        socketId: socket.id,
        reason,
      });
    });
  });

  return io;
}

export type OrderSocketEvent = "created" | "updated" | "deleted";

export interface OrderSocketPayload {
  orderId: string;
  order?: unknown;
}

export function emitOrderEvent(
  event: OrderSocketEvent,
  payload: OrderSocketPayload
): void {
  if (!io) return;
  io.to("dashboard").emit(`order:${event}`, payload);
}

export function getSocketIO(): Server | null {
  return io;
}
