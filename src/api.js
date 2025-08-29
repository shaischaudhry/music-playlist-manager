// src/api.js

export const BASE_URL = "https://www.theaudiodb.com/api/v1/json";
export const API_KEY = "2";

/**
 * Search for artists by name.
 * @param {string} artistName
 * @returns {Promise<any[]>} Resolves to an array of artist objects.
 */
export async function searchArtistsByName(artistName) {
  const url = `${BASE_URL}/${API_KEY}/search.php?s=${encodeURIComponent(artistName)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[searchArtistsByName] parsed JSON:", data);

    return data.artists || [];
  } catch (error) {
    console.error("Error searching artists:", error);
    throw error;
  }
}

/**
 * Fetch albums for a given artist ID.
 * @param {string} artistId
 * @returns {Promise<any[]>} Resolves to an array of album objects.
 */

const cache = {}
export async function fetchAlbumsByArtistId(artistId) {
  
  if (artistId in cache) {
    console.log(`[cache] hit for ID=${artistId} (length=${cache[artistId].length})`);
    return cache[artistId];
  }
  const url = `${BASE_URL}/${API_KEY}/album.php?i=${encodeURIComponent(artistId)}`;
  
  
  const response = await fetch(url);

  
  if (!response.ok) {
    // if for instance artistId invalid or server error (e.g., 404, 500)
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[fetch] parsed JSON:", data);

  const albums = Array.isArray(data.album) ? data.album : [];

  // 7. Cache the result (even if empty) and return it
  cache[artistId] = albums;
  console.log(`[cache] saved ${albums.length} item(s) for ID=${artistId}`);

  return albums;
}
