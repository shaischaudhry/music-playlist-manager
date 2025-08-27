// src/playlists.js

/**
 * A single playlist object has:
 *  - id: unique string
 *  - name: user-given name
 *  - description: optional text
 *  - songs: array of song identifiers
 *
 * We store all playlists in localStorage under this key.
 */
const STORAGE_KEY = "musicApp.playlists";

/**
 * Read playlists from browser storage.
 * localStorage.getItem(...) returns a string or null.
 * JSON.parse(...) turns a JSON string into a JavaScript value.
 */
export function getAllPlaylists() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // Nothing stored yet → return empty list
    return [];
  }

  try {
    // Convert string back into array of playlist objects
    return JSON.parse(raw);
  } catch (err) {
    // If JSON is broken, warn and reset storage
    console.warn("Corrupt playlist data, resetting storage");
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Save a JavaScript array of playlists back to localStorage.
 * JSON.stringify(...) turns objects into a string.
 */
function saveAllPlaylists(list) {
  const asString = JSON.stringify(list);
  localStorage.setItem(STORAGE_KEY, asString);
}

/**
 * Create and store a new playlist.
 * - name: required string
 * - description: optional string
 * Returns the new playlist object.
 */
export function createPlaylist(name, description) {
  // 1. Get the current list
  const list = getAllPlaylists();

  // 2. Build a fresh playlist object
  const newPL = {
    id: Date.now().toString(), // unique ID based on timestamp
    name,
    description,
    songs: []                  // start with no songs
  };

  // 3. Add it to the list
  list.push(newPL);

  // 4. Save the updated list back to storage
  saveAllPlaylists(list);

  // 5. Return the new playlist so callers know its ID
  return newPL;
}

/**
 * Delete a playlist by its ID.
 */
export function deletePlaylist(id) {
  // Keep only those playlists whose id does NOT match
  const filtered = getAllPlaylists().filter(pl => pl.id !== id);
  saveAllPlaylists(filtered);
}

/**
 * Add or remove a song from a playlist.
 * If songId already in playlist.songs → remove it.
 * Otherwise → add it.
 */
export function toggleSongInPlaylist(playlistId, songId) {
  const list = getAllPlaylists();
  const pl   = list.find(p => p.id === playlistId);
  if (!pl) {
    // No playlist found for that ID → do nothing
    return;
  }

  const idx = pl.songs.indexOf(songId);
  if (idx === -1) {
    // songId not in list → add it
    pl.songs.push(songId);
  } else {
    // songId already there → remove it
    pl.songs.splice(idx, 1);
  }

  saveAllPlaylists(list);
}
