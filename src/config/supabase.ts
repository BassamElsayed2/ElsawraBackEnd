import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

// Create Supabase client with service role key for backend operations
export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// Bucket names as specified
export const BUCKETS = {
  AVATARS: "avatars",
  BRANCHES: "branches",
  PRODUCT_IMAGES: "product-images",
  COMBO_OFFERS_MEDIA: "combooffersmedia",
} as const;

// File upload options
export const UPLOAD_OPTIONS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  imageProcessing: {
    quality: 80,
    format: "webp" as const,
    maxWidth: 1200,
    thumbnailSize: 300,
  },
} as const;
