// Public contract for TheAudioDB integration; implemented in Phase 2.
export const BASE_URL = "https://www.theaudiodb.com/api/v1/json";
export const API_KEY = "2"; // demo key

/**
 * Fetch albums for an artist ID (implementation added in Phase 2).
 * @param {string} artistId
 * @returns {Promise<{ albums: any[] }>}
 */
export async function fetchAlbumsByArtistId(artistId) {
  throw new Error("fetchAlbumsByArtistId not implemented yet");
}
