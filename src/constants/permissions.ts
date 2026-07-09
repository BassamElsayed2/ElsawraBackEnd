export interface PermissionDefinition {
  key: string;
  label_ar: string;
  group: string;
}

export const PERMISSION_GROUPS: Record<string, string> = {
  users: "المستخدمين",
  roles: "الأدوار",
  products: "المنتجات",
  orders: "الطلبات",
  branches: "الفروع",
  ads: "العروض",
  feedback: "التقييمات",
  delivery: "التوصيل",
  settings: "الإعدادات",
};

export const PERMISSIONS_CATALOG: PermissionDefinition[] = [
  { key: "users:read", label_ar: "عرض المستخدمين", group: "users" },
  { key: "users:manage", label_ar: "إدارة المستخدمين", group: "users" },
  { key: "roles:read", label_ar: "عرض الأدوار", group: "roles" },
  { key: "roles:manage", label_ar: "إدارة الأدوار", group: "roles" },
  { key: "products:read", label_ar: "عرض المنتجات", group: "products" },
  { key: "products:manage", label_ar: "إدارة المنتجات", group: "products" },
  { key: "orders:read", label_ar: "عرض الطلبات", group: "orders" },
  { key: "orders:manage", label_ar: "إدارة الطلبات", group: "orders" },
  { key: "branches:read", label_ar: "عرض الفروع", group: "branches" },
  { key: "branches:manage", label_ar: "إدارة الفروع", group: "branches" },
  { key: "ads:read", label_ar: "عرض العروض", group: "ads" },
  { key: "ads:manage", label_ar: "إدارة العروض", group: "ads" },
  { key: "feedback:read", label_ar: "عرض التقييمات", group: "feedback" },
  { key: "feedback:manage", label_ar: "إدارة التقييمات", group: "feedback" },
  { key: "delivery:read", label_ar: "عرض التوصيل", group: "delivery" },
  { key: "delivery:manage", label_ar: "إدارة التوصيل", group: "delivery" },
  { key: "settings:read", label_ar: "عرض الإعدادات", group: "settings" },
  { key: "settings:manage", label_ar: "إدارة الإعدادات", group: "settings" },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS_CATALOG.map((p) => p.key);

export function isValidPermission(key: string): boolean {
  return ALL_PERMISSION_KEYS.includes(key);
}
