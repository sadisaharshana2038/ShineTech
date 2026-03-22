/**
 * Converts a standard Google Drive sharing link into a direct download link
 * that can be used in an <img> tag.
 * 
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 * 
 * @param {string} url The original Google Drive URL
 * @returns {string} The transformed direct link or original URL if not a Drive link
 */
export const getDirectDriveLink = (url) => {
    if (!url || typeof url !== 'string') return url;

    // 1. Decode URL in case it's a search result or redirect (e.g. %3D, %3F, etc.)
    let decodedUrl = url;
    try {
        decodedUrl = decodeURIComponent(url);
    } catch (e) {
        // Fallback to original if decoding fails
    }

    // 2. Strong Regex to match Google Drive file IDs in any URL format
    // Matches: 
    // - /file/d/[ID]
    // - [?&]id=[ID]
    // - /u/0/d/[ID] (lh3 format)
    // - /uc?id=[ID] (old format)
    const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)|\/u\/0\/d\/([a-zA-Z0-9_-]+)/;
    const match = decodedUrl.match(driveRegex);

    if (match) {
        const fileId = match[1] || match[2] || match[3];
        // Thumbnails are often more reliable than 'uc' for direct image display
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    return url;
};

/**
 * Ensures an image path is correctly formatted with the BASE_URL
 * and handles Google Drive transformation if necessary.
 */
export const formatImagePath = (img) => {
    if (!img) return '';
    
    // 1. Handle Google Drive links
    const driveLink = getDirectDriveLink(img);
    if (driveLink !== img) return driveLink;

    // 2. Handle absolute/external URLs
    if (img.startsWith('http') || img.startsWith('data:')) {
        return img;
    }
    
    const baseUrl = import.meta.env.BASE_URL || '/';
    
    // Prevent double-prefixing if the path already includes the base URL
    // e.g. path is "/Shine-Tech/movies/avatar.jpg" and baseUrl is "/Shine-Tech/"
    if (baseUrl !== '/' && img.startsWith(baseUrl)) {
        return img;
    }

    // In development/localhost, strip the production-only subfolder prefix if it exists
    let cleanPath = img.startsWith('/') ? img.slice(1) : img;
    let finalPath = cleanPath;
    if (import.meta.env.DEV && cleanPath.startsWith('Shine-Tech/')) {
        finalPath = cleanPath.replace('Shine-Tech/', '');
    }

    // Ensure we don't return "//" if path is empty after cleaning
    if (!finalPath) return baseUrl;

    return `${baseUrl}${finalPath.startsWith('/') ? finalPath.slice(1) : finalPath}`;
};
