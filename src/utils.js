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
    const name  = (album.strAlbum         || "").toLowerCase();
    const genre = (album.strGenre         || "").toLowerCase();
    const year  = String(album.intYearReleased || "").toLowerCase();

    // True if any field includes the query substring
    return (
      name.includes(q) ||
      genre.includes(q) ||
      year.includes(q)
    );
  });
}