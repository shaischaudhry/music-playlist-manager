
// src/api.js

export const BASE_URL = "https://musicbrainz.org/ws/2";
export const FORMAT = "json";

/**
 * Fetch artists by name search.
 * @param {string} query - Artist name to search for
 * @param {number} limit - Maximum number of results (default: 15)
 * @returns {Promise<any[]>} Resolves to an array of artist objects.
 */
export async function fetchArtistsByName(query, limit = 15) {
  const url = `${BASE_URL}/artist/?query=artist:${encodeURIComponent(query)}&limit=${limit}&fmt=${FORMAT}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[fetchArtistsByName] parsed JSON:", data);

    return data.artists || [];
  } catch (error) {
    console.error("Error fetching artists:", error);
    throw error;
  }
}

/**
 * Fetch popular artists for the home page.
 * @param {number} limit - Maximum number of results (default: 20)
 * @returns {Promise<any[]>} Resolves to an array of artist objects.
 */
export async function fetchPopularArtists(limit = 20) {
  // For now, we'll fetch some well-known artists as placeholders
  // In a real app, this could be based on popularity metrics
  const popularArtistNames = [
    "The Beatles", "Queen", "Michael Jackson", "Madonna", "Elvis Presley",
    "Bob Dylan", "David Bowie", "Prince", "Stevie Wonder", "Aretha Franklin",
    "Pink Floyd", "Led Zeppelin", "The Rolling Stones", "U2", "Coldplay",
    "Taylor Swift", "Ed Sheeran", "Adele", "Drake", "Post Malone"
  ];
  
  const artists = [];
  
  for (const name of popularArtistNames.slice(0, limit)) {
    try {
      const artistResults = await fetchArtistsByName(name, 1);
      if (artistResults.length > 0) {
        artists.push(artistResults[0]);
      }
    } catch (error) {
      console.warn(`Failed to fetch artist: ${name}`, error);
    }
  }
  
  return artists;
}

/**
 * Fetch albums for a given artist ID.
 * @param {string} artistId - MusicBrainz artist ID
 * @returns {Promise<any[]>} Resolves to an array of album objects.
 */
export async function fetchAlbumsByArtistId(artistId) {
  const url = `${BASE_URL}/release/?artist=${encodeURIComponent(artistId)}&type=album&status=official&fmt=${FORMAT}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[fetchAlbumsByArtistId] parsed JSON:", data);

    return data.releases || [];
  } catch (error) {
    console.error("Error fetching albums:", error);
    throw error;
  }
}

/**
 * Fetch tracks for a given album ID.
 * @param {string} albumId - MusicBrainz release ID
 * @returns {Promise<any[]>} Resolves to an array of track objects.
 */
export async function fetchTracksByAlbumId(albumId) {
  const url = `${BASE_URL}/recording/?release=${encodeURIComponent(albumId)}&fmt=${FORMAT}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[fetchTracksByAlbumId] parsed JSON:", data);

    return data.recordings || [];
  } catch (error) {
    console.error("Error fetching tracks:", error);
    throw error;
  }
}
