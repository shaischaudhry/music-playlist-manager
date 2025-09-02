# Music Playlist Manager

A lightweight, client‑side web app to discover artists, browse albums, view tracks, and build simple playlists — powered by MusicBrainz (artist discovery) and TheAudioDB (albums/tracks).

This project focuses on clarity and responsiveness: no frameworks, just semantic HTML, modern CSS, and vanilla JS.

## Features

- Top Picks: Fetches 15 artists from MusicBrainz by genre on load (default: rock)
- Artist Search: Load albums by artist name via TheAudioDB
- Albums → Tracks: Click an album to view its tracks
- Playlists:
  - Create playlists (modal)
  - Add/remove tracks to/from playlists
  - Search/filter playlists by name/description
- Fast, cached album lookups by artist name
- Clean, responsive UI (grid-based cards)

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript (ES Modules)
- MusicBrainz WS 2.0 API (artists)
- TheAudioDB API (albums, tracks)
- LocalStorage for playlist persistence
- No build step required (deploy as static site)

## Architecture

- src/api.js
  - MusicBrainz: getHomeArtistsMusicBrainz(genre, limit)
  - TheAudioDB: getArtistByName_TheAudioDB(name), fetchAlbumsByArtistName(name), fetchTracksByAlbumId(albumId)
  - Simple MusicBrainz throttle to respect 1 req/sec
- src/app.js
  - UI rendering and event wiring
  - Top picks, search, albums, tracks, playlist modal, and playlist search
- src/playlists.js
  - getAllPlaylists, createPlaylist, deletePlaylist, toggleSongInPlaylist
  - Stores playlists in localStorage
- src/utils.js
  - filterAlbums helper for client-side album filtering
- styles/styles.css
  - Design system and responsive layouts

## Project Structure

```
.
├─ index.html
├─ styles/
│  └─ styles.css
└─ src/
   ├─ api.js
   ├─ app.js
   ├─ playlists.js
   └─ utils.js
```

## Getting Started (Local)

You can open index.html directly, but using a static server is recommended (CORS, module imports).

Option A — VS Code Live Server:
- Open the folder in VS Code
- Right-click index.html → “Open with Live Server”

Option B — npx serve (Node.js 18+):
- npm install -g serve
- serve .

Then visit the URL shown (e.g., http://localhost:3000).

## Configuration

TheAudioDB test key is used by default:
- src/api.js → TADB_API_KEY = "2"
- You can replace with your own key if you have one.

Note on MusicBrainz User-Agent:
- Browsers disallow setting a custom User-Agent header; the code includes a header but modern browsers ignore it.
- Keep requests modest and the built-in throttle helps respect MB’s rate limits.

## Usage

1) Top Picks
- On load, 15 artists (genre: rock) are shown. Click an artist to load albums.

2) Search by Artist
- Enter an artist name and click “Load Albums” to fetch albums via TheAudioDB.

3) Albums and Tracks
- Albums render as cards. Click an album to view its tracks.
- “Back to Albums” returns to the album grid.

4) Playlists
- Click “+ Create Playlist” to open the modal, enter a name (and optional description).
- In the Tracks view, use the button per track to add/remove it from a playlist.
- Search playlists with the search bar when you have at least one playlist.

## Known Limitations

- MusicBrainz thumbnails aren’t provided; top picks use a placeholder emoji (option to merge TheAudioDB thumbs by name if needed).
- MusicBrainz custom User-Agent header cannot be set from the browser (spec-compliant behavior).
- Data quality varies by external API coverage.

## Contributing

- Keep PRs small and focused (single responsibility).
- Use clear commit messages (feat, fix, chore).
- Add simple console logs when debugging network requests; remove them before merging.

## License

MIT
