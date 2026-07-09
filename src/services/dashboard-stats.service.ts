import { pool } from "../config/database";
import { OrdersService } from "./orders.service";
import { ProductsService } from "./products.service";

export class DashboardStatsService {
  static async getDashboardStats() {
    const [countsResult, orderStats, bestsellers] = await Promise.all([
      pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM profiles p) AS total_users,
          (SELECT COUNT(*) FROM products) AS total_products
      `),
      OrdersService.getOrderStats(),
      ProductsService.getBestsellers(5),
    ]);

    const counts = countsResult.recordset[0];
    const bestsellerProducts = bestsellers.products || [];

    const topProducts = bestsellerProducts.map(
      (product: {
        id: string;
        title_ar?: string;
        title_en?: string;
        image_url?: string;
        order_count?: number;
      }) => ({
        id: product.id,
        title: product.title_ar || product.title_en || "منتج",
        image_url: product.image_url || "/placeholder.svg",
        orders_count: product.order_count ?? 0,
        total_revenue: 0,
      })
    );

    if (topProducts.length > 0) {
      const revenueByProduct = await this.getRevenueByProductIds(
        topProducts.map((p) => p.id)
      );
      topProducts.forEach((product) => {
        product.total_revenue = revenueByProduct.get(product.id) ?? 0;
      });
    }

    return {
      total_users: counts.total_users ?? 0,
      total_products: counts.total_products ?? 0,
      order_stats: orderStats,
      top_products: topProducts,
    };
  }

  private static async getRevenueByProductIds(productIds: string[]) {
    const revenueMap = new Map<string, number>();
    if (productIds.length === 0) return revenueMap;

    const request = pool.request();
    const conditions = productIds
      .map((_, index) => `items.product_id = @productId${index}`)
      .join(" OR ");
    productIds.forEach((id, index) => {
      request.input(`productId${index}`, id);
    });

    const result = await request.query(`
      SELECT
        items.product_id AS product_id,
        COALESCE(SUM(
          items.quantity * COALESCE(items.price, items.subtotal / NULLIF(items.quantity, 0), 0)
        ), 0) AS total_revenue
      FROM orders o
      CROSS APPLY OPENJSON(o.items) WITH (
        product_id uniqueidentifier '$.product_id',
        quantity int '$.quantity',
        price decimal(10,2) '$.price',
        subtotal decimal(10,2) '$.subtotal',
        type nvarchar(20) '$.type'
      ) AS items
      WHERE o.status IN ('delivered', 'completed')
        AND items.type = 'product'
        AND (${conditions})
      GROUP BY items.product_id
    `);

    for (const row of result.recordset) {
      revenueMap.set(row.product_id, Number(row.total_revenue) || 0);
    }

    return revenueMap;
  }
}
