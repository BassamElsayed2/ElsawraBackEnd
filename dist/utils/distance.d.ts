/**
 * Haversine formula to calculate distance between two points on Earth
 * Returns distance in kilometers
 */
export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Find the nearest branch to a given location
 */
export declare function findNearestBranch(userLat: number, userLon: number, branches: Array<{
    id: string;
    latitude: number;
    longitude: number;
    name_ar: string;
    name_en: string;
}>): {
    branch: any;
    distance: number;
} | null;
//# sourceMappingURL=distance.d.ts.map