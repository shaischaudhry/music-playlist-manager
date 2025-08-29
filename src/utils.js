/**
 * Filters albums by matching name, genre, or year.
 * @param {Array} albums
 * @param {string} query
 * @returns {Array} filtered albums
 */
export function filterAlbums(albums, query) {
  const q = query.trim().toLowerCase();
  console.log("[filterAlbums] query:", q);

  if (!q) {
    // No search text → show everything
    return albums;
  }

  return albums.filter(album => {
    const name  = (album.title         || "").toLowerCase();
    const date  = String(album.date    || "").toLowerCase();
    const country = String(album.country || "").toLowerCase();

    // True if any field includes the query substring
    return (
      name.includes(q) ||
      date.includes(q) ||
      country.includes(q)
    );
  });
}

/**
 * Filters tracks by matching title.
 * @param {Array} tracks
 * @param {string} query
 * @returns {Array} filtered tracks
 */
export function filterTracks(tracks, query) {
  const q = query.trim().toLowerCase();
  console.log("[filterTracks] query:", q);

  if (!q) {
    // No search text → show everything
    return tracks;
  }

  return tracks.filter(track => {
    const title = (track.title || "").toLowerCase();
    
    // True if title includes the query substring
    return title.includes(q);
  });
}