// src/app.js
import { fetchAlbumsByArtistId } from "./api.js";

const artistIdInput  = document.getElementById("artistId");
const loadBtn        = document.getElementById("loadAlbumsBtn");
const albumsContainer = document.getElementById("albums");

// Enable/disable Load button
artistIdInput.addEventListener("input", () => {
  loadBtn.disabled = artistIdInput.value.trim().length === 0;
});

// Handle click
loadBtn.addEventListener("click", async () => {
  const id = artistIdInput.value.trim();
  albumsContainer.innerHTML = "<p>Loading…</p>";

  try {
    const albums = await fetchAlbumsByArtistId(id);

    // if no albums found
    if (albums.length === 0) {
      albumsContainer.innerHTML = "<p>No albums found.</p>";
      return;
    }

    // Render albums
    albumsContainer.innerHTML = ""; // clear loading text
    albums.forEach(album => {
      const card = document.createElement("div");
      card.className = "album-card";
      card.innerHTML = `
        <img src="${album.strAlbumThumb}" alt="${album.strAlbum} cover" />
        <h3>${album.strAlbum}</h3>
        <p>${album.intYearReleased}</p>
        <p>${album.strGenre || 'Unknown genre'}</p>
      `;
      albumsContainer.append(card);
    });

  } catch (err) {
    // Network error, bad ID, JSON parse error
    albumsContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    console.error("fetchAlbumsByArtistId failed:", err);
  }
});
