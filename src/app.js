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

// Grab modal elements
const createPlaylistModal = document.getElementById("createPlaylistModal");
const modalPlaylistForm = document.getElementById("modalPlaylistForm");
const modalPlaylistName = document.getElementById("modalPlaylistName");
const modalPlaylistDesc = document.getElementById("modalPlaylistDesc");
const cancelCreatePlaylist = document.getElementById("cancelCreatePlaylist");

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
  
    // Hide albums section initially while loading
    albumsContainer.style.visibility = "hidden";
    toggleSearchAlbumsSection(false);
    
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
  
  // Show albums section and search albums section
  albumsContainer.style.visibility = "visible";
  toggleSearchAlbumsSection(true);

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
    `;


    albumsContainer.appendChild(card);
  });
}

//
// 6. Handle album selection and load tracks
//
async function selectAlbum(album) {
  try {
    // Show loading state
    const tracksSection = document.getElementById("tracks-section");
    if (tracksSection) {
      tracksSection.style.display = "block";
      document.getElementById("tracks-container").innerHTML = "<p>Loading tracks...</p>";
    }
    
    const tracks = await fetchTracksByAlbumId(album.idAlbum);
    renderTracks(tracks);
    
    // Scroll to the tracks section
    tracksSection.scrollIntoView({ behavior: 'smooth' });
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
  
  // Hide albums and show tracks in the same position
  albumsContainer.style.display = "none"; // Change visibility:hidden to display:none
  tracksSection.style.display = "block";

  tracksContainer.innerHTML = "";
  
  tracks.forEach((track, trackIndex) => {
    const trackElement = document.createElement("div");
    trackElement.className = "track-card";
    trackElement.innerHTML = `
      <h4>${track.strTrack || 'Unknown Track'}</h4>
            <p>Duration: ${track.intDuration ? formatDuration(track.intDuration) : 'Unknown'}</p>
                 <button class="track-playlist-btn" data-track-id="${track.idTrack}">
        ${isTrackInPlaylist(track.idTrack) ? 'Remove from Playlist' : '+ Add to Playlist'}
      </button>
    `;
    tracksContainer.appendChild(trackElement);

    const playlistButton = trackElement.querySelector('.track-playlist-btn');
    playlistButton.addEventListener('click', () => {
      if (isTrackInPlaylist(track.idTrack)) {
        // Remove from playlist
        removeTrackFromPlaylist(track.idTrack);
      } else {
        // Add to playlist
        addTrackToPlaylist(track.idTrack);
      }
      // Re-render tracks to update button text
      renderTracks(tracks);
    });


    // Add back button to return to albums (only for first track)
    if (trackIndex === 0) {
          // Update the back button handler to properly toggle display
      const backButton = document.createElement("button");
      backButton.className = "back-to-albums-btn";
      backButton.textContent = "← Back to Albums";
      backButton.addEventListener('click', () => {
        tracksSection.style.display = "none";
        albumsContainer.style.display = "grid"; // Change from visibility:visible to display:grid
      });
      tracksContainer.insertBefore(backButton, tracksContainer.firstChild);
    }
  });
}

//
// 8. Add track to playlist functionality
//
function addTrackToPlaylist(trackId) {
  // Get all playlists
  const playlists = getAllPlaylists();
  
  // First find the track object to get its name
  let trackName = trackId; // Default if not found
  
  // Find the track in all displayed tracks (currently being viewed)
  const trackElements = document.querySelectorAll('.track-card');
  trackElements.forEach(element => {
    const button = element.querySelector('.track-playlist-btn');
    if (button && button.dataset.trackId === trackId) {
      const heading = element.querySelector('h4');
      if (heading) trackName = heading.textContent;
    }
  });
  
  // Store the track ID and name together
  const trackInfo = {
    id: trackId,
    name: trackName
  };
  
  if (playlists.length === 0) {
    // Create a default playlist if none exist
    const newPlaylist = createPlaylist("My Playlist", "Default playlist for tracks");
    toggleSongInPlaylist(newPlaylist.id, trackInfo);
  } else {
    // Show playlist selection (you can enhance this later)
    const firstPlaylist = playlists[0];
    toggleSongInPlaylist(firstPlaylist.id, trackInfo);
  }
  
  // Re-render playlists to show updated state
  renderPlaylists();
}
//
// 9. Remove track from playlist
//
function removeTrackFromPlaylist(trackId) {
  const playlists = getAllPlaylists();
  for (const playlist of playlists) {
    if (playlist.songs.includes(trackId)) {
      toggleSongInPlaylist(playlist.id, trackId);
      break;
    }
  }
  renderPlaylists();
}

//
// 9. Format duration from milliseconds to MM:SS
//
function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
//
// 10. Check if track is already in any playlist
//
function isTrackInPlaylist(trackId) {
  const playlists = getAllPlaylists();
  return playlists.some(playlist => 
    playlist.songs.includes(trackId)
  );
}

function toggleSearchAlbumsSection(show) {
  const searchAlbumsSection = document.getElementById("searchAlbumsSection");
  if (searchAlbumsSection) {
    searchAlbumsSection.style.display = show ? "flex" : "none";
  }
}

// Show modal when "Create Playlist" button is clicked
document.addEventListener('DOMContentLoaded', () => {
  const createPlaylistBtn = document.getElementById('createPlaylistBtn');
  if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', () => {
      createPlaylistModal.style.display = "flex";
      modalPlaylistName.value = "";
      modalPlaylistDesc.value = "";
      modalPlaylistName.focus();
    });
  }
});

// Handle modal form submission
if (modalPlaylistForm) {
  modalPlaylistForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = modalPlaylistName.value.trim();
    const desc = modalPlaylistDesc.value.trim();
    if (!name) return;

    // Prevent duplicate playlist names (case-insensitive)
    const allPlaylists = getAllPlaylists() || [];
    if (allPlaylists.some(pl => (pl.name || "").toLowerCase() === name.toLowerCase())) {
      alert("A playlist with this name already exists.");
      return;
    }
    
    // Create the playlist
    createPlaylist(name, desc);
    
    // Clear the form
    modalPlaylistName.value = "";
    modalPlaylistDesc.value = "";
    
    // Close the modal
    createPlaylistModal.style.display = "none";
    
    // Re-render playlists to show the new one
    renderPlaylists();
  });
}
// Handle cancel button
if (cancelCreatePlaylist) {
  cancelCreatePlaylist.addEventListener("click", () => {
    createPlaylistModal.style.display = "none";
  });
}

// Optional: Close modal when clicking outside modal content
if (createPlaylistModal) {
  createPlaylistModal.addEventListener("click", (e) => {
    if (e.target === createPlaylistModal) {
      createPlaylistModal.style.display = "none";
    }
  });
}

//
// 12.. Reset to homepage state
//
function resetToHomepage() {
  // Show top picks section
  const topPicksSection = document.getElementById("top-picks");
  if (topPicksSection) {
    topPicksSection.style.display = "block";
  }
  
  // Hide albums section
  albumsContainer.style.visibility = "hidden";
  
  // Hide search albums section
  toggleSearchAlbumsSection(false);
  
  // Clear albums container
  albumsContainer.innerHTML = "";
  
  // Clear search inputs
  artistIdInput.value = "";
  searchInput.value = "";
  
  // Disable load button
  loadBtn.disabled = true;
}

// Accept an optional filter query (string)
function renderPlaylists(filterQuery = "") {
  playlistList.innerHTML = "";

  // Get all playlists BEFORE filtering
  const allPlaylists = getAllPlaylists() || [];

  // Show/hide playlist search bar based on whether there are any playlists at all
  const playlistSearchContainer = document.getElementById("playlistSearchContainer");
  if (playlistSearchContainer) {
    playlistSearchContainer.style.display = allPlaylists.length === 0 ? "none" : "";
  }

  // Now filter for display
  let all = allPlaylists;
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

      pl.songs.forEach(song => {
    const li = document.createElement("li");
    // Handle both new format (objects) and old format (just IDs)
    const songId = typeof song === 'object' ? song.id : song;
    const title = typeof song === 'object' ? song.name : songId;
    
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
  
  const topPicksSection = document.getElementById("top-picks");
  if (topPicksSection) {
    topPicksSection.style.display = "none";
  }
  
  // Hide albums section initially while loading
  albumsContainer.style.visibility = "hidden";
  toggleSearchAlbumsSection(false);
  
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
/*playlistForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = playlistName.value.trim();
  const desc = playlistDesc.value.trim();
  if (!name) return;

  createPlaylist(name, desc);
  playlistName.value = "";
  playlistDesc.value = "";
  renderPlaylists();
});*/

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
