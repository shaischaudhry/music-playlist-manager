// src/app.js

import { 
  fetchArtistsByName, 
  fetchPopularArtists, 
  fetchAlbumsByArtistId, 
  fetchTracksByAlbumId 
} from "./api.js";
import { filterAlbums, filterTracks } from "./utils.js";
import {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  toggleSongInPlaylist
} from "./playlists.js";

//
// 1. Grab DOM elements
//
const artistSearchInput = document.getElementById("artistSearch");
const searchArtistBtn = document.getElementById("searchArtistBtn");
const artistList = document.getElementById("artistList");
const albumsSection = document.getElementById("albums-section");
const albumsTitle = document.getElementById("albums-title");
const albumsContainer = document.getElementById("albums");
const albumSearchInput = document.getElementById("albumSearch");
const viewTracksBtn = document.getElementById("viewTracksBtn");
const tracksSection = document.getElementById("tracks-section");
const tracksTitle = document.getElementById("tracks-title");
const tracksContainer = document.getElementById("tracks");
const trackSearchInput = document.getElementById("trackSearch");

// Playlist elements
const playlistSearch = document.getElementById("playlistSearch");
const playlistSearchBtn = document.getElementById("playlistSearchBtn");
const playlistForm = document.getElementById("playlistForm");
const playlistName = document.getElementById("playlistName");
const playlistDesc = document.getElementById("playlistDesc");
const playlistList = document.getElementById("playlistList");

//
// 2. In-memory cache for fetched data
//
let albumCache = [];
let trackCache = {};
let currentArtist = null;
let currentAlbum = null;

//
// 3. Initialize the app
//
async function initializeApp() {
  try {
    // Load popular artists on page load
    await loadPopularArtists();
    
    // Initial render of playlists
    renderPlaylists();
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

//
// 4. Load popular artists for the home page
//
async function loadPopularArtists() {
  try {
    artistList.innerHTML = '<div class="loading">Loading popular artists...</div>';
    
    const artists = await fetchPopularArtists(20);
    
    if (artists.length === 0) {
      artistList.innerHTML = '<p>No artists found.</p>';
      return;
    }
    
    renderArtists(artists);
  } catch (error) {
    console.error("Error loading popular artists:", error);
    artistList.innerHTML = '<p class="error">Failed to load artists.</p>';
  }
}

//
// 5. Render artist cards
//
function renderArtists(artists) {
  artistList.innerHTML = "";
  
  artists.forEach(artist => {
    const card = document.createElement("div");
    card.className = "card";
    card.addEventListener("click", () => selectArtist(artist));
    
    card.innerHTML = `
      <div class="thumb">
        <span>🎵</span>
      </div>
      <h3>${artist.name || 'Unknown Artist'}</h3>
      <p class="meta">${artist.type || 'Artist'}</p>
      ${artist.country ? `<p class="meta">${artist.country}</p>` : ''}
    `;
    
    artistList.appendChild(card);
  });
}

//
// 6. Artist selection and album loading
//
async function selectArtist(artist) {
  try {
    currentArtist = artist;
    albumsSection.style.display = "block";
    tracksSection.style.display = "none";
    
    albumsTitle.textContent = `Albums by ${artist.name}`;
    albumsContainer.innerHTML = '<div class="loading">Loading albums...</div>';
    
    const albums = await fetchAlbumsByArtistId(artist.id);
    albumCache = albums;
    
    if (albums.length === 0) {
      albumsContainer.innerHTML = '<p>No albums found for this artist.</p>';
      return;
    }
    
    renderAlbums(albums);
  } catch (error) {
    console.error("Error loading albums:", error);
    albumsContainer.innerHTML = '<p class="error">Failed to load albums.</p>';
  }
}

//
// 7. Render album cards
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
    card.addEventListener("click", () => selectAlbum(album));

    card.innerHTML = `
      <img
        src="/images/default-thumb.jpeg"
        alt="${album.title || 'Unknown Title'} cover"
        onerror="this.src='/images/default-thumb.jpeg'"
      />
      <h3>${album.title || 'Unknown Title'}</h3>
      <p>${album.date || 'Year N/A'}</p>
      <p>${album.country || 'Country N/A'}</p>
    `;

    albumsContainer.appendChild(card);
  });
}

//
// 8. Album selection and track loading
//
async function selectAlbum(album) {
  try {
    currentAlbum = album;
    tracksSection.style.display = "block";
    
    tracksTitle.textContent = `Tracks from ${album.title}`;
    tracksContainer.innerHTML = '<div class="loading">Loading tracks...</div>';
    
    const tracks = await fetchTracksByAlbumId(album.id);
    trackCache[album.id] = tracks;
    
    if (tracks.length === 0) {
      tracksContainer.innerHTML = '<p>No tracks found for this album.</p>';
      return;
    }
    
    renderTracks(tracks);
  } catch (error) {
    console.error("Error loading tracks:", error);
    tracksContainer.innerHTML = '<p class="error">Failed to load tracks.</p>';
  }
}

//
// 9. Render track cards
//
function renderTracks(tracks) {
  tracksContainer.innerHTML = "";
  
  if (tracks.length === 0) {
    tracksContainer.innerHTML = "<p>No tracks to display.</p>";
    return;
  }

  const playlists = getAllPlaylists();

  tracks.forEach(track => {
    const card = document.createElement("div");
    card.className = "track-card";

    const duration = track.length ? formatDuration(track.length) : 'Unknown';
    
    card.innerHTML = `
      <h4>${track.title || 'Unknown Title'}</h4>
      <p>Duration: ${duration}</p>
      <div class="track-actions">
        <select class="playlist-select" data-track-id="${track.id}">
          <option value="">+ Add to playlist…</option>
          ${playlists.map(pl => `<option value="${pl.id}">${pl.name}</option>`).join("")}
        </select>
      </div>
    `;

    const select = card.querySelector(".playlist-select");
    select.addEventListener("change", e => {
      const playlistId = e.target.value;
      if (!playlistId) return;

      toggleSongInPlaylist(playlistId, track.id);
      renderPlaylists();
      e.target.value = "";
    });

    tracksContainer.appendChild(card);
  });
}

//
// 10. Format duration from milliseconds to MM:SS
//
function formatDuration(ms) {
  if (!ms) return 'Unknown';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

//
// 11. Artist search functionality
//
async function searchArtist() {
  const query = artistSearchInput.value.trim();
  if (!query) return;
  
  try {
    artistList.innerHTML = '<div class="loading">Searching for artists...</div>';
    
    const artists = await fetchArtistsByName(query, 15);
    
    if (artists.length === 0) {
      artistList.innerHTML = '<p>No artists found matching your search.</p>';
      return;
    }
    
    renderArtists(artists);
  } catch (error) {
    console.error("Error searching artists:", error);
    artistList.innerHTML = '<p class="error">Search failed. Please try again.</p>';
  }
}

//
// 12. Filter albums as user types
//
function filterAlbumsBySearch() {
  const query = albumSearchInput.value.trim();
  const filtered = filterAlbums(albumCache, query);
  renderAlbums(filtered);
}

//
// 13. Filter tracks as user types
//
function filterTracksBySearch() {
  const query = trackSearchInput.value.trim();
  if (!currentAlbum) return;
  
  const tracks = trackCache[currentAlbum.id] || [];
  const filtered = filterTracks(tracks, query);
  renderTracks(filtered);
}

//
// 14. Render playlist cards
//
function renderPlaylists(filterQuery = "") {
  playlistList.innerHTML = "";

  let all = getAllPlaylists() || [];
  const q = (filterQuery || "").trim().toLowerCase();
  if (q) {
    all = all.filter(pl =>
      (pl.name || "").toLowerCase().includes(q) ||
      (pl.description || "").toLowerCase().includes(q)
    );
  }

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

    const songsList = document.createElement("ul");
    songsList.className = "playlist-songs";

    pl.songs.forEach(songId => {
      const li = document.createElement("li");
      // Try to find track info from cache
      let trackTitle = songId;
      for (const albumId in trackCache) {
        const track = trackCache[albumId].find(t => t.id === songId);
        if (track) {
          trackTitle = track.title;
          break;
        }
      }
      
      li.innerHTML = `
        <span>${trackTitle}</span>
        <button class="remove-song"
                data-playlist-id="${pl.id}"
                data-track-id="${songId}"
        >&times;</button>
      `;
      songsList.appendChild(li);
    });

    card.appendChild(songsList);
    playlistList.appendChild(card);
  });
}

//
// 15. Event Listeners
//

// Artist search
searchArtistBtn.addEventListener("click", searchArtist);
artistSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchArtist();
  }
});

// Album filtering
albumSearchInput.addEventListener("input", filterAlbumsBySearch);

// Track filtering
trackSearchInput.addEventListener("input", filterTracksBySearch);

// View tracks button
viewTracksBtn.addEventListener("click", () => {
  if (currentAlbum) {
    selectAlbum(currentAlbum);
  }
});

// Create playlist
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

// Delete playlist or song
playlistList.addEventListener("click", e => {
  if (e.target.matches("button.remove")) {
    const id = e.target.dataset.id;
    deletePlaylist(id);
    renderPlaylists();
  }
  if (e.target.matches("button.remove-song")) {
    const pid = e.target.dataset.playlistId;
    const tid = e.target.dataset.trackId;
    toggleSongInPlaylist(pid, tid);
    renderPlaylists();
  }
});

// Playlist search
if (playlistSearch) {
  playlistSearch.addEventListener("input", () => {
    renderPlaylists(playlistSearch.value);
  });

  if (playlistSearchBtn) {
    playlistSearchBtn.addEventListener("click", () => {
      renderPlaylists(playlistSearch.value);
    });
  }

  playlistSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (playlistSearchBtn) playlistSearchBtn.click();
      else renderPlaylists(playlistSearch.value);
    }
  });
}

//
// 16. Initialize the app
//
initializeApp();
