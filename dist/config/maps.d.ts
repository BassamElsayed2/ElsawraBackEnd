import NodeCache from "node-cache";
export declare const mapsCache: NodeCache;
export declare const GOOGLE_MAPS_CONFIG: {
    apiKey: string;
    language: string;
    region: string;
    componentsFilter: string;
};
export interface GeocodingResult {
    lat: number;
    lng: number;
    formatted_address: string;
}
export interface ReverseGeocodingResult {
    address: string;
    area?: string;
    city?: string;
    country?: string;
}
export declare function generateCacheKey(address: string): string;
export declare function geocodeAddress(address: string): Promise<GeocodingResult | null>;
export declare function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null>;
export declare function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
export interface Branch {
    id: string;
    name_ar: string;
    name_en: string;
    lat: number;
    lng: number;
}
export declare function findNearestBranch(userLat: number, userLng: number, branches: Branch[]): Branch | null;
//# sourceMappingURL=maps.d.ts.map