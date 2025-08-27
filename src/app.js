// App entry: wires DOM anchors and minimal affordances.
import { fetchAlbumsByArtistId } from "./api.js";

const artistIdInput = document.getElementById("artistId");
const loadBtn = document.getElementById("loadAlbumsBtn");
const albumsContainer = document.getElementById("albums");

// Enable button only when input has content.
artistIdInput.addEventListener("input", () => {
  loadBtn.disabled = artistIdInput.value.trim().length === 0;
});

// Placeholder handler; real logic arrives in Phase 2.
loadBtn.addEventListener("click", async () => {
  albumsContainer.textContent = "Loading…";
  setTimeout(() => {
    albumsContainer.textContent = "Albums will appear here in Phase 2.";
  }, 400);
});
