import { 
  getHomeArtistsMusicBrainz, 
  fetchAlbumsByArtistName, 
  fetchTracksByAlbumId,
  getArtistByName_TheAudioDB
} from "./api.js";
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
const artistList       = document.getElementById("artistList");
// NEW — playlist search elements
const playlistSearch    = document.getElementById("playlistSearch");
const playlistSearchBtn = document.getElementById("playlistSearchBtn");


const playlistForm     = document.getElementById("playlistForm");
const playlistName     = document.getElementById("playlistName");
const playlistDesc     = document.getElementById("playlistDesc");
const playlistList     = document.getElementById("playlistList");

//
// 2. In-memory cache for fetched albums
//
let albumCache = [];

//
// 3. Load popular artists on page load
//
async function loadPopularArtists() {
  try {
    const artists = await getHomeArtistsMusicBrainz('rock', 15)
    renderPopularArtists(artists);
  } catch (error) {
    console.error("Error loading popular artists:", error);
  }
}

//
// 4. Render popular artists in top picks section
//
function renderPopularArtists(artists) {
  if (!artistList) return;
  
  artistList.innerHTML = "";
  
  artists.forEach(artist => {
    const card = document.createElement("div");
    card.className = "card";
    card.addEventListener("click", () => selectPopularArtist(artist));
    
    card.innerHTML = `
      <div class="thumb">
        <span>🎵</span>
      </div>
      <h3>${artist.name || 'Unknown Artist'}</h3>
      <p class="meta">${artist.type || 'Artist'}</p>
    `;
    
    artistList.appendChild(card);
  });
}

//
// 5. Handle popular artist selection
//
async function selectPopularArtist(artist) {
  // Hide top picks section
  const topPicksSection = document.getElementById("top-picks");
  if (topPicksSection) {
    topPicksSection.style.display = "none";
  }
  
  // Load albums for this artist
  try {
    const tadbArtist = await getArtistByName_TheAudioDB(artist.name);
      if (!tadbArtist) {
         albumsContainer.innerHTML = "<p class='error'>No albums found for this artist.</p>";
        return;
      }

const albums = await fetchAlbumsByArtistName(tadbArtist[0].strArtist);
    albumCache = albums;
    renderAlbums(albumCache);
    renderPlaylists();
  } catch (error) {
    console.error("Error loading albums for popular artist:", error);
    albumsContainer.innerHTML = `<p class="error">Error loading albums: ${error.message}</p>`;
  }
}

//
// 3. Render album cards (with "Add to playlist" dropdown)
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
// 6. Handle album selection and load tracks
//
async function selectAlbum(album) {
  try {
    const tracks = await fetchTracksByAlbumId(album.idAlbum);
    // Show tracks in UI (you'll need to create this)
    renderTracks(tracks);
  } catch (error) {
    console.error("Error loading tracks:", error);
    alert("Error loading tracks for this album.");
  }
}

//
// 7. Render track cards
//
function renderTracks(tracks) {
  const tracksContainer = document.getElementById("tracks-container");
  const tracksSection = document.getElementById("tracks-section");
  
  if (!tracksContainer) return;
  
  tracksSection.style.display = "block";
  tracksContainer.innerHTML = "";
  
  tracks.forEach(track => {
    const trackElement = document.createElement("div");
    trackElement.className = "track-card";
    trackElement.innerHTML = `
      <h4>${track.strTrack || 'Unknown Track'}</h4>
      <p>Duration: ${track.intDuration ? Math.floor(track.intDuration / 1000) + 's' : 'Unknown'}</p>
      <button onclick="addTrackToPlaylist('${track.idTrack}')">+ Add to Playlist</button>
    `;
    tracksContainer.appendChild(trackElement);
  });
}

//
// 8. Add track to playlist functionality
//
function addTrackToPlaylist(trackId) {
  // Get all playlists
  const playlists = getAllPlaylists();
  
  if (playlists.length === 0) {
    // Create a default playlist if none exist
    const playlistId = createPlaylist("My Playlist", "Default playlist for tracks");
    toggleSongInPlaylist(playlistId, trackId);
  } else {
    // Show playlist selection (you can enhance this later)
    const firstPlaylist = playlists[0];
    toggleSongInPlaylist(firstPlaylist.id, trackId);
  }
  
  // Re-render playlists to show updated state
  renderPlaylists();
}

// Accept an optional filter query (string)
function renderPlaylists(filterQuery = "") {
  playlistList.innerHTML = "";

  // Read all playlists and optionally filter by name/description
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
// 6. Enable/disable Load button based on input
//
artistIdInput.addEventListener("input", () => {
  loadBtn.disabled = artistIdInput.value.trim().length === 0;
});

//
// 7. Fetch and display albums on button click
//
loadBtn.addEventListener("click", async () => {
  const artistName = artistIdInput.value.trim();
  albumsContainer.innerHTML = "<p>Loading…</p>";

  try {
    // First search for the artist by name
    const artists = await getArtistByName_TheAudioDB(artistName);
    
    if (!artists.length) {
      albumsContainer.innerHTML = "<p class='error'>No artists found with that name.</p>";
      return;
    }
    
    // Use the first artist found to get albums
    const firstArtist = artists[0];
    const albums = await fetchAlbumsByArtistName(firstArtist.strArtist);
    albumCache = albums;
    renderAlbums(albumCache);
    renderPlaylists();  // also re-render playlists to show song lists
  } catch (err) {
    console.error("Error fetching albums:", err);
    albumsContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
});

//
// 8. Filter displayed albums as user types
//
searchInput.addEventListener("input", () => {
  const filtered = filterAlbums(albumCache, searchInput.value);
  renderAlbums(filtered);
});

//
// 9. Create a new playlist
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
// 10. Delete a playlist or a song within a playlist
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

// NEW — playlist search wiring: live filter + button + Enter key
if (playlistSearch) {
  // live filter while typing
  playlistSearch.addEventListener("input", () => {
    renderPlaylists(playlistSearch.value);
  });

  // explicit search button (for accessibility)
  if (playlistSearchBtn) {
    playlistSearchBtn.addEventListener("click", () => {
      renderPlaylists(playlistSearch.value);
    });
  }

  // pressing Enter in the input triggers the search button
  playlistSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (playlistSearchBtn) playlistSearchBtn.click();
      else renderPlaylists(playlistSearch.value);
    }
  });
}

//
// 11. Initial render of playlists on page load
//
renderPlaylists();

//
// 12. Initial load of popular artists on page load
//
loadPopularArtists();
