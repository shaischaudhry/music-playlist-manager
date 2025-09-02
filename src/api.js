// --- TheAudioDB constants ---
export const TADB_BASE_URL = "https://www.theaudiodb.com/api/v1/json";
export const TADB_API_KEY = "2";

// --- MusicBrainz constants ---
export const MB_BASE_URL = "https://musicbrainz.org/ws/2";
export const MB_USER_AGENT = "music-playlist-manager/1.0 (dev@yourdomain.com)";

// MusicBrainz limit is 1 request per second
// Ensure we do not exceed this rate
let lastMBRequestTime = 0;
async function throttleMusicBrainz() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastMBRequestTime));
  if (wait > 0) await new Promise(res => setTimeout(res, wait));
  lastMBRequestTime = Date.now();
}

/**
 * Fetch artists by genre from MusicBrainz.
 * @param {string} genre - e.g. "rock"
 * @param {number} limit - number of artists to fetch
 * @returns {Promise<any[]>} Resolves to an array of artist objects.
 */
export async function getHomeArtistsMusicBrainz(genre = "rock", limit = 15) {
  await throttleMusicBrainz(); // Wait if needed to respect rate limit
  const url = `${MB_BASE_URL}/artist?query=tag:${encodeURIComponent(genre)}&fmt=json&limit=${limit}`;
  const response = await fetch(url, {
    headers: { "User-Agent": MB_USER_AGENT }
  });
  if (!response.ok) throw new Error(`MusicBrainz error: ${response.status}`);
  const data = await response.json();
  return data.artists || [];
}

/**
 * Find TheAudioDB artist by name.
 * @param {string} name - The artist name to search for.
 * @returns {Promise<any|null>} Resolves to the artist object or null if not found.
 */
export async function getArtistByName_TheAudioDB(name) {
  const url = `${TADB_BASE_URL}/${TADB_API_KEY}/search.php?s=${encodeURIComponent(name)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TheAudioDB error: ${response.status}`);
  const data = await response.json();
  // TheAudioDB returns an array of artists, or null if not found
  return data.artists || null;
}


/**
 * Fetch albums for a given artist name
 * @param {string} artistId
 * @returns {Promise<any[]>} Resolves to an array of album objects.
 */

const cache = {}
export async function fetchAlbumsByArtistName(artistName) {
  
  if (artistName in cache) {
    console.log(`[cache] hit for ID=${artistId} (length=${cache[artistName].length})`);
    return cache[artistName];
  }
  const url = `${TADB_BASE_URL}/${TADB_API_KEY}/searchalbum.php?s=${encodeURIComponent(artistName)}`;
  const response = await fetch(url);

  
  if (!response.ok) {
    // if for instance artistId invalid or server error (e.g., 404, 500)
    throw new Error(`TheAudioDB error: ${response.status}`);
  }

  const data = await response.json();
  console.log("[fetch] parsed JSON:", data);

  const albums = Array.isArray(data.album) ? data.album : [];

  // 7. Cache the result (even if empty) and return it
  cache[artistName] = albums;
  console.log(`[cache] saved ${albums.length} item(s) for artist=${artistName}`);

  return albums;
}

/**
 * Fetch tracks for a given album ID from TheAudioDB.
 * @param {string} albumId - TheAudioDB album ID.
 * @returns {Promise<any[]>} Resolves to an array of track objects.
 */
export async function fetchTracksByAlbumId(albumId) {
  const url = `${TADB_BASE_URL}/${TADB_API_KEY}/track.php?m=${encodeURIComponent(albumId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheAudioDB error: ${response.status}`);
  }

  const data = await response.json();
  // TheAudioDB returns an array of tracks, or null if not found
  return Array.isArray(data.track) ? data.track : [];
}
