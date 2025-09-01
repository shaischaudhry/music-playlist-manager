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
  return data.artists ? data.artists[0] : null;
}


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
 * Fetch popular artists for the top picks section.
 * @returns {Promise<any[]>} Resolves to an array of popular artist objects.
 */
export async function fetchPopularArtists() {
  // Use some well-known artists as popular picks
  const popularNames = ["Coldplay", "The Beatles", "Queen", "Michael Jackson", "Madonna"];
  const artists = [];
  
  for (const name of popularNames) {
    try {
      const results = await searchArtistsByName(name);
      if (results.length > 0) {
        artists.push(results[0]);
      }
    } catch (error) {
      console.warn(`Failed to fetch popular artist: ${name}`, error);
    }
  }
  
  return artists;
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
  const url = `${TADB_BASE_URL}/${TADB_API_KEY}/album.php?i=${encodeURIComponent(artistId)}`;
  
  const response = await fetch(url);

  
  if (!response.ok) {
    // if for instance artistId invalid or server error (e.g., 404, 500)
    throw new Error(`TheAudioDB error: ${response.status}`);
  }

  const data = await response.json();
  console.log("[fetch] parsed JSON:", data);

  const albums = Array.isArray(data.album) ? data.album : [];

  // 7. Cache the result (even if empty) and return it
  cache[artistId] = albums;
  console.log(`[cache] saved ${albums.length} item(s) for ID=${artistId}`);

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

/**
 * Global search: runs 3 parallel TheAudioDB calls (artist, album, track).
 * @param {string} query - The search string.
 * @returns {Promise<{artists: any[], albums: any[], tracks: any[]}>}
 */
export async function searchAllTheAudioDB(query) {
  const [artistRes, albumRes, trackRes] = await Promise.all([
    fetch(`${TADB_BASE_URL}/${TADB_API_KEY}/search.php?s=${encodeURIComponent(query)}`).then(r => r.json()),
    fetch(`${TADB_BASE_URL}/${TADB_API_KEY}/searchalbum.php?a=${encodeURIComponent(query)}`).then(r => r.json()),
    fetch(`${TADB_BASE_URL}/${TADB_API_KEY}/searchtrack.php?t=${encodeURIComponent(query)}`).then(r => r.json())
  ]);
  return {
    artists: artistRes.artists || [],
    albums: albumRes.album || [],
    tracks: trackRes.track || []
  };
}