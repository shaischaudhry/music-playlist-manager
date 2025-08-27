/**
 * Filters albums by query matching name, genre, or year.
 * @param {Array} albums
 * @param {string} query
 * @returns {Array} filtered albums
 */
export function filterAlbums(albums, query) {
  const q = query.trim().toLowerCase();
  if (!q) return albums;
  return albums.filter(album => {
    const name  = (album.strAlbum  || '').toLowerCase();
    const genre = (album.strGenre  || '').toLowerCase();
    const year  = String(album.intYearReleased || '').toLowerCase();
    return name.includes(q) || genre.includes(q) || year.includes(q);
  });
}
