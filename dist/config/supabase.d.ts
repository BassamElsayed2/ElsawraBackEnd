export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare const BUCKETS: {
    readonly AVATARS: "avatars";
    readonly BRANCHES: "branches";
    readonly PRODUCT_IMAGES: "product-images";
    readonly COMBO_OFFERS_MEDIA: "combooffersmedia";
};
export declare const UPLOAD_OPTIONS: {
    readonly maxFileSize: number;
    readonly allowedMimeTypes: readonly ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    readonly imageProcessing: {
        readonly quality: 80;
        readonly format: "webp";
        readonly maxWidth: 1200;
        readonly thumbnailSize: 300;
    };
};
//# sourceMappingURL=supabase.d.ts.map