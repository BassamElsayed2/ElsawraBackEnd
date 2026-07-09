import { pool } from "../config/database";

export interface UsersListFilters {
  search?: string;
}

export class UsersListService {
  static async getDashboardAdmins(
    page: number = 1,
    limit: number = 10,
    filters: UsersListFilters = {},
  ) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];

    if (filters.search) {
      whereConditions.push(
        "(full_name LIKE @search OR email LIKE @search OR phone LIKE @search OR role LIKE @search OR job_title LIKE @search)",
      );
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countRequest = pool.request();
    const dataRequest = pool.request();

    if (filters.search) {
      countRequest.input("search", `%${filters.search}%`);
      dataRequest.input("search", `%${filters.search}%`);
    }

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total
      FROM dashboard_users
      ${whereClause}
    `);

    const result = await dataRequest
      .input("offset", offset)
      .input("limit", limit).query(`
        SELECT
          id, id as user_id, full_name, role,
          image_url, job_title, address, about,
          email, phone, COALESCE(is_active, 1) as is_active,
          created_at as joined_at, updated_at
        FROM dashboard_users
        ${whereClause}
        ORDER BY created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    const total = countResult.recordset[0]?.total ?? 0;

    return {
      admins: result.recordset,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getCustomers(
    page: number = 1,
    limit: number = 10,
    filters: UsersListFilters = {},
  ) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];

    if (filters.search) {
      whereConditions.push(
        "(p.full_name LIKE @search OR u.email LIKE @search OR p.phone LIKE @search)",
      );
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countRequest = pool.request();
    const dataRequest = pool.request();

    if (filters.search) {
      countRequest.input("search", `%${filters.search}%`);
      dataRequest.input("search", `%${filters.search}%`);
    }

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total
      FROM profiles p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `);

    const result = await dataRequest
      .input("offset", offset)
      .input("limit", limit).query(`
        SELECT
          p.id, p.user_id, p.full_name, p.phone, p.phone_verified,
          p.created_at as joined_at, p.updated_at,
          u.email, u.email_verified, COALESCE(u.is_active, 1) as is_active,
          COUNT(CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN 1 END) as orders_count
        FROM profiles p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN orders o ON p.user_id = o.user_id
        ${whereClause}
        GROUP BY p.id, p.user_id, p.full_name, p.phone, p.phone_verified,
                 p.created_at, p.updated_at, u.email, u.email_verified, u.is_active
        ORDER BY p.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    const total = countResult.recordset[0]?.total ?? 0;

    return {
      users: result.recordset,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
