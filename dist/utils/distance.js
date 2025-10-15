"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.findNearestBranch = findNearestBranch;
/**
 * Haversine formula to calculate distance between two points on Earth
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Find the nearest branch to a given location
 */
function findNearestBranch(userLat, userLon, branches) {
    if (!branches || branches.length === 0) {
        return null;
    }
    let nearest = {
        branch: branches[0],
        distance: calculateDistance(userLat, userLon, branches[0].latitude, branches[0].longitude),
    };
    for (let i = 1; i < branches.length; i++) {
        const distance = calculateDistance(userLat, userLon, branches[i].latitude, branches[i].longitude);
        if (distance < nearest.distance) {
            nearest = {
                branch: branches[i],
                distance,
            };
        }
    }
    return nearest;
}
//# sourceMappingURL=distance.js.map