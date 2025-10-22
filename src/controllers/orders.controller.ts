import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { OrdersService } from "../services/orders.service";
import { asyncHandler } from "../middleware/error.middleware";

export class OrdersController {
  // Get user orders
  static getUserOrders = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      const { page, limit } = req.query as any;
      const result = await OrdersService.getUserOrders(
        req.user.id,
        parseInt(page) || 1,
        parseInt(limit) || 10
      );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Get order by ID
  static getOrderById = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user?.id;

      const order = await OrdersService.getOrderById(id, userId);

      res.json({
        success: true,
        data: { order },
      });
    }
  );

  // Create order
  static createOrder = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      // Check if user has phone number (required for orders)
      const userProfile = await OrdersService.getUserProfile(req.user.id);

      if (!userProfile.phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required to place an order",
          error: "PHONE_REQUIRED",
          messageAr: "رقم الهاتف مطلوب لإتمام الطلب",
        });
      }

      const order = await OrdersService.createOrder(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order },
      });
    }
  );

  // Cancel order
  static cancelOrder = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      const { id } = req.params;
      const order = await OrdersService.cancelOrder(id, req.user.id);

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: { order },
      });
    }
  );

  // Update order status (admin)
  static updateOrderStatus = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { status } = req.body;

      const order = await OrdersService.updateOrderStatus(id, status);

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: { order },
      });
    }
  );

  // Mark order as paid (user)
  static markOrderAsPaid = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      const { id } = req.params;
      const order = await OrdersService.markOrderAsPaid(id, req.user.id);

      res.json({
        success: true,
        message: "Order marked as paid successfully",
        data: { order },
      });
    }
  );

  // Get all orders (admin)
  static getAllOrders = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { page, limit, status, order_id, customer_name } = req.query as any;

      const result = await OrdersService.getAllOrders(
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        order_id,
        customer_name
      );

      console.log("📦 Orders Result:", {
        totalOrders: result.orders.length,
        total: result.total,
        searchedOrderId: order_id,
        searchedCustomerName: customer_name,
        status: status || "all",
      });

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Debug orders by status
  static debugOrdersByStatus = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { status } = req.query as any;

      console.log("🔍 Debug Orders by Status:", status);

      const result = await OrdersService.getAllOrders(
        1,
        100, // Get more orders for debugging
        status,
        undefined
      );

      console.log("🔍 Debug Result:", {
        status: status || "all",
        totalOrders: result.orders.length,
        total: result.total,
        orders: result.orders.map((o) => ({
          id: o.id,
          status: o.status,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          total: o.total,
          created_at: o.created_at,
        })),
      });

      res.json({
        success: true,
        message: `Debug orders for status: ${status || "all"}`,
        data: {
          status: status || "all",
          totalOrders: result.orders.length,
          total: result.total,
          orders: result.orders.map((o) => ({
            id: o.id,
            status: o.status,
            payment_status: o.payment_status,
            payment_method: o.payment_method,
            total: o.total,
            created_at: o.created_at,
          })),
        },
      });
    }
  );

  // Get order by ID (admin - no user restriction)
  static getOrderByIdAdmin = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      // Don't pass userId to allow admin to see any order
      const order = await OrdersService.getOrderById(id);

      res.json({
        success: true,
        data: { order },
      });
    }
  );

  // Get order statistics (admin)
  static getOrderStats = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { start_date, end_date, branch_id } = req.query as any;

      const stats = await OrdersService.getOrderStats({
        start_date,
        end_date,
        branch_id,
      });

      res.json({
        success: true,
        data: { stats },
      });
    }
  );

  // Delete order (admin only)
  static deleteOrder = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const result = await OrdersService.deleteOrder(id);

      res.json({
        success: true,
        data: result,
      });
    }
  );
}
