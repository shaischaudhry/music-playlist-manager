// src/app.js

import { fetchAlbumsByArtistId } from "./api.js";
import { filterAlbums }          from "./utils.js";
import {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist
} from "./playlists.js";

//
// 1. Grab all the DOM elements we’ll need
//
const artistIdInput   = document.getElementById("artistId");
const loadBtn         = document.getElementById("loadAlbumsBtn");
const searchInput     = document.getElementById("searchQuery");
const albumsContainer = document.getElementById("albums");

const playlistForm    = document.getElementById("playlistForm");
const playlistName    = document.getElementById("playlistName");
const playlistDesc    = document.getElementById("playlistDesc");
const playlistList    = document.getElementById("playlistList");

//
// 2. In-memory cache of the last fetched album list
//
let albumCache = [];

//
// 3. Renders album cards (or “no albums” message) into albumsContainer
//
function renderAlbums(albums) {
  albumsContainer.innerHTML = "";

  if (albums.length === 0) {
    albumsContainer.innerHTML = "<p>No albums to display.</p>";
    return;
  }

  albums.forEach(album => {
    const card = document.createElement("div");
    card.className = "album-card";

    // Inline onerror fallback so we never try to load “null”
    card.innerHTML = `
      <img
        src="${album.strAlbumThumb || '/images/default-thumb.jpeg'}"
        alt="${album.strAlbum || 'Unknown Title'} cover"
        onerror="this.src='/images/default-thumb.jpeg'"
      />
      <h3>${album.strAlbum}</h3>
      <p>${album.intYearReleased}</p>
      <p>${album.strGenre || 'Unknown genre'}</p>
    `;

    albumsContainer.appendChild(card);
  });
}

//
// 4. Renders playlist cards (or “no playlists” message) into playlistList
//
function renderPlaylists() {
  playlistList.innerHTML = "";

  const all = getAllPlaylists();
  if (all.length === 0) {
    playlistList.innerHTML = "<p>No playlists yet.</p>";
    return;
  }

  all.forEach(pl => {
    const card = document.createElement("div");
    card.className = "playlist-card";

    card.innerHTML = `
      <h3>${pl.name}</h3>
      <p>${pl.description || ""}</p>
      <p>Tracks: ${pl.songs.length}</p>
      <button class="remove" data-id="${pl.id}">&times;</button>
    `;

    playlistList.appendChild(card);
  });
}

//
// 5. Enable/disable Load button based on Artist ID input
//
artistIdInput.addEventListener("input", () => {
  loadBtn.disabled = artistIdInput.value.trim().length === 0;
});

//
// 6. Load Albums: fetch, cache, and render
//
loadBtn.addEventListener("click", async () => {
  const id = artistIdInput.value.trim();
  albumsContainer.innerHTML = "<p>Loading…</p>";

  try {
    const albums = await fetchAlbumsByArtistId(id);
    albumCache = albums;         // keep for filtering
    renderAlbums(albumCache);
  } catch (err) {
    albumsContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    console.error("fetchAlbumsByArtistId failed:", err);
  }
});

//
// 7. Filter displayed albums as the user types
//
searchInput.addEventListener("input", () => {
  const filtered = filterAlbums(albumCache, searchInput.value);
  renderAlbums(filtered);
});

//
// 8. Create new playlist on form submit
//
playlistForm.addEventListener("submit", e => {
  e.preventDefault();                    // don’t reload the page
  const name = playlistName.value.trim();
  const desc = playlistDesc.value.trim();
  if (!name) return;                     // name is required

  createPlaylist(name, desc);            // save to localStorage
  playlistName.value = "";
  playlistDesc.value = "";
  renderPlaylists();                     // show the new playlist
});

//
// 9. Delete playlist when its “×” button is clicked
//
playlistList.addEventListener("click", e => {
  if (e.target.matches("button.remove")) {
    const id = e.target.dataset.id;      // read data-id from HTML
    deletePlaylist(id);                  // remove from storage
    renderPlaylists();                   // update UI
  }
});

//
// 10. On page load, show any existing playlists
//
renderPlaylists();
