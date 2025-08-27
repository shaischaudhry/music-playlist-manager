// src/app.js

import { fetchAlbumsByArtistId } from "./api.js";
import { filterAlbums }          from "./utils.js";
import {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  toggleSongInPlaylist
} from "./playlists.js";

//
// 1. Grab DOM elements
//
const artistIdInput    = document.getElementById("artistId");
const loadBtn          = document.getElementById("loadAlbumsBtn");
const searchInput      = document.getElementById("searchQuery");
const albumsContainer  = document.getElementById("albums");

const playlistForm     = document.getElementById("playlistForm");
const playlistName     = document.getElementById("playlistName");
const playlistDesc     = document.getElementById("playlistDesc");
const playlistList     = document.getElementById("playlistList");

//
// 2. In-memory cache for fetched albums
//
let albumCache = [];

//
// 3. Render album cards (with “Add to playlist” dropdown)
//
function renderAlbums(albums) {
  albumsContainer.innerHTML = "";

  if (albums.length === 0) {
    albumsContainer.innerHTML = "<p>No albums to display.</p>";
    return;
  }

  const playlists = getAllPlaylists();

  albums.forEach(album => {
    const card = document.createElement("div");
    card.className = "album-card";

    card.innerHTML = `
      <img
        src="${album.strAlbumThumb || '/images/default-thumb.jpeg'}"
        alt="${album.strAlbum || 'Unknown Title'} cover"
        onerror="this.src='/images/default-thumb.jpeg'"
      />
      <h3>${album.strAlbum || 'Unknown Title'}</h3>
      <p>${album.intYearReleased || 'Year N/A'}</p>
      <p>${album.strGenre || 'Genre N/A'}</p>
      <select class="playlist-select" data-album-id="${album.idAlbum}">
        <option value="">+ Add to playlist…</option>
        ${playlists.map(pl => `<option value="${pl.id}">${pl.name}</option>`).join("")}
      </select>
    `;

    const select = card.querySelector(".playlist-select");
    select.addEventListener("change", e => {
      const playlistId = e.target.value;
      if (!playlistId) return;

      toggleSongInPlaylist(playlistId, album.idAlbum);
      renderPlaylists();
      e.target.value = "";
    });

    albumsContainer.appendChild(card);
  });
}

//
// 4. Render playlist cards (now with song lists and remove‐song buttons)
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

    // list each song with its own remove button
    const songsList = document.createElement("ul");
    songsList.className = "playlist-songs";

    pl.songs.forEach(songId => {
      const li = document.createElement("li");
      const album = albumCache.find(a => a.idAlbum === songId);
      const title = album ? album.strAlbum : songId;
      li.innerHTML = `
        <span>${title}</span>
        <button class="remove-song"
                data-playlist-id="${pl.id}"
                data-album-id="${songId}"
        >&times;</button>
      `;
      songsList.appendChild(li);
    });

    card.appendChild(songsList);
    playlistList.appendChild(card);
  });
}

//
// 5. Enable/disable Load button based on input
//
artistIdInput.addEventListener("input", () => {
  loadBtn.disabled = artistIdInput.value.trim().length === 0;
});

//
// 6. Fetch and display albums on button click
//
loadBtn.addEventListener("click", async () => {
  const id = artistIdInput.value.trim();
  albumsContainer.innerHTML = "<p>Loading…</p>";

  try {
    const albums = await fetchAlbumsByArtistId(id);
    albumCache = albums;
    renderAlbums(albumCache);
    renderPlaylists();  // also re-render playlists to show song lists
  } catch (err) {
    console.error("Error fetching albums:", err);
    albumsContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
});

//
// 7. Filter displayed albums as user types
//
searchInput.addEventListener("input", () => {
  const filtered = filterAlbums(albumCache, searchInput.value);
  renderAlbums(filtered);
});

//
// 8. Create a new playlist
//
playlistForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = playlistName.value.trim();
  const desc = playlistDesc.value.trim();
  if (!name) return;

  createPlaylist(name, desc);
  playlistName.value = "";
  playlistDesc.value = "";
  renderPlaylists();
});

//
// 9. Delete a playlist or a song within a playlist
//
playlistList.addEventListener("click", e => {
  if (e.target.matches("button.remove")) {
    const id = e.target.dataset.id;
    deletePlaylist(id);
    renderPlaylists();
  }
  if (e.target.matches("button.remove-song")) {
    const pid = e.target.dataset.playlistId;
    const aid = e.target.dataset.albumId;
    toggleSongInPlaylist(pid, aid);
    renderPlaylists();
  }
});

//
// 10. Initial render of playlists on page load
//
renderPlaylists();
