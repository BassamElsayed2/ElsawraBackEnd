import { Request } from "express";

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: "user" | "admin";
  };
}

// Database types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  phone_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  device_name?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  location?: any;
  is_current: boolean;
  last_activity: Date;
  expires_at: Date;
  created_at: Date;
}

export interface Product {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  category_id: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductType {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  created_at: Date;
}

export interface ProductSize {
  id: string;
  type_id: string;
  size_ar: string;
  size_en: string;
  price: number;
  offer_price?: number;
  created_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  address_id: string;
  delivery_type: "delivery" | "pickup";
  branch_id?: string;
  status:
    | "pending"
    | "pending_payment"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivering"
    | "delivered"
    | "cancelled";
  items: string; // JSON string
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  image_url?: string;
  created_at: Date;
}

export interface Branch {
  id: string;
  name_ar: string;
  name_en: string;
  address_ar: string;
  address_en: string;
  phone: string;
  email?: string;
  image_url?: string;
  lat: number;
  lng: number;
  is_active: boolean;
  created_at: Date;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: Date;
}
