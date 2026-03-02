/**
 * apiConfig.js - Centralised URL helpers
 *
 * REACT_APP_API_URL examples:
 *   Local:  "http://localhost:5000/api"
 *   Vercel: "https://dpdlab1.slt.lk:8447/salon-api/api"
 *
 * Components use ${API_URL}/api/salons/... so API_URL must NOT include /api.
 * Image paths need just the origin (scheme+host+port) to avoid /salon-api prefix.
 */

const RAW_API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000/api";

/**
 * Base URL WITHOUT the /api suffix.
 * Use as: fetch(`${API_URL}/api/salons/...`)
 *   Local:  "http://localhost:5000"
 *   Vercel: "https://dpdlab1.slt.lk:8447/salon-api"
 */
export const API_URL = RAW_API_URL.replace(/\/api\/?$/, "");

/**
 * Origin only (scheme + host + port) — for /uploads/ image paths.
 * Excludes any path prefix like /salon-api so images resolve correctly.
 *   Local:  "http://localhost:5000"
 *   Vercel: "https://dpdlab1.slt.lk:8447"
 */
const extractOrigin = () => {
    try {
        return new URL(RAW_API_URL).origin;
    } catch {
        return API_URL.split("/").slice(0, 3).join("/");
    }
};

export const IMAGE_ORIGIN = extractOrigin();

/** Build a full image URL handling relative paths, full URLs, and base64 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
    if (imagePath.length > 200) return `data:image/jpeg;base64,${imagePath}`;
    return `${IMAGE_ORIGIN}/uploads/${imagePath}`;
};

export const getProfessionalImageUrl = (imagePath, name = "Pro") => {
    if (!imagePath) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=120`;
    }
    if (imagePath.length > 200) return `data:image/jpeg;base64,${imagePath}`;
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
    return `${IMAGE_ORIGIN}/uploads/professionals/${imagePath}`;
};

export const getServiceImageUrl = (imagePath, name = "Service") => {
    if (!imagePath) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=120`;
    }
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
    if (imagePath.length > 200) return `data:image/jpeg;base64,${imagePath}`;

    const normalizedPath = imagePath.replace(/\\/g, '/');
    const finalPath = normalizedPath.includes('/') ? normalizedPath : `services/${normalizedPath}`;
    return `${IMAGE_ORIGIN}/uploads/${finalPath}`;
};

export const getSalonImageUrl = (imagePath, fallbackSeed = 1) => {
    if (!imagePath) return `https://picsum.photos/100/100?random=${fallbackSeed}`;
    return getImageUrl(imagePath);
};
