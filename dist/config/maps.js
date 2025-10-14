"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOOGLE_MAPS_CONFIG = exports.mapsCache = void 0;
exports.generateCacheKey = generateCacheKey;
exports.geocodeAddress = geocodeAddress;
exports.reverseGeocode = reverseGeocode;
exports.calculateDistance = calculateDistance;
exports.findNearestBranch = findNearestBranch;
const node_cache_1 = __importDefault(require("node-cache"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create in-memory cache for geocoding results
exports.mapsCache = new node_cache_1.default({
    stdTTL: 86400, // 24 hours
    checkperiod: 3600, // Check for expired keys every hour
    useClones: false,
});
// Google Maps Configuration
exports.GOOGLE_MAPS_CONFIG = {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    language: "ar",
    region: "EG",
    componentsFilter: "country:eg", // Restrict to Egypt
};
// Generate cache key from address
function generateCacheKey(address) {
    return address.toLowerCase().trim().replace(/\s+/g, "_");
}
// Geocode address using Google Maps API
async function geocodeAddress(address) {
    const cacheKey = generateCacheKey(address);
    // Check cache first
    const cached = exports.mapsCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.append("address", address);
        url.searchParams.append("key", exports.GOOGLE_MAPS_CONFIG.apiKey);
        url.searchParams.append("language", exports.GOOGLE_MAPS_CONFIG.language);
        url.searchParams.append("region", exports.GOOGLE_MAPS_CONFIG.region);
        url.searchParams.append("components", exports.GOOGLE_MAPS_CONFIG.componentsFilter);
        const response = await fetch(url.toString());
        const data = await response.json();
        if (data.status === "OK" && data.results.length > 0) {
            const result = data.results[0];
            const geocoded = {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formatted_address: result.formatted_address,
            };
            // Store in cache
            exports.mapsCache.set(cacheKey, geocoded);
            return geocoded;
        }
        return null;
    }
    catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}
// Reverse geocode coordinates to address
async function reverseGeocode(lat, lng) {
    const cacheKey = `reverse_${lat}_${lng}`;
    // Check cache first
    const cached = exports.mapsCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.append("latlng", `${lat},${lng}`);
        url.searchParams.append("key", exports.GOOGLE_MAPS_CONFIG.apiKey);
        url.searchParams.append("language", exports.GOOGLE_MAPS_CONFIG.language);
        const response = await fetch(url.toString());
        const data = await response.json();
        if (data.status === "OK" && data.results.length > 0) {
            const result = data.results[0];
            const reversed = {
                address: result.formatted_address,
            };
            // Extract area and city from address components
            for (const component of result.address_components) {
                if (component.types.includes("sublocality") ||
                    component.types.includes("locality")) {
                    reversed.area = component.long_name;
                }
                if (component.types.includes("administrative_area_level_1")) {
                    reversed.city = component.long_name;
                }
                if (component.types.includes("country")) {
                    reversed.country = component.long_name;
                }
            }
            // Store in cache
            exports.mapsCache.set(cacheKey, reversed);
            return reversed;
        }
        return null;
    }
    catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
}
// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}
function findNearestBranch(userLat, userLng, branches) {
    if (branches.length === 0)
        return null;
    let nearest = branches[0];
    let minDistance = calculateDistance(userLat, userLng, branches[0].lat, branches[0].lng);
    for (let i = 1; i < branches.length; i++) {
        const distance = calculateDistance(userLat, userLng, branches[i].lat, branches[i].lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = branches[i];
        }
    }
    return nearest;
}
//# sourceMappingURL=maps.js.map