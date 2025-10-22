"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_OPTIONS = exports.BUCKETS = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
}
// Create Supabase client with service role key for backend operations
exports.supabase = supabaseUrl && supabaseServiceKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;
// Bucket names as specified
exports.BUCKETS = {
    AVATARS: "avatars",
    BRANCHES: "branches",
    PRODUCT_IMAGES: "product-images",
    COMBO_OFFERS_MEDIA: "combooffersmedia",
};
// File upload options
exports.UPLOAD_OPTIONS = {
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
        format: "webp",
        maxWidth: 1200,
        thumbnailSize: 300,
    },
};
//# sourceMappingURL=supabase.js.map