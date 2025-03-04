import { storeUserBackend, getUserBackend } from "./indexedDB.js";

document.addEventListener("DOMContentLoaded", async () => {
  await fetchPlaylist();
});

async function fetchPlaylist() {
  try {
    // Get playlistId from URL
    const playlistId = getQueryParam("playlistId");
    if (playlistId === null) {
      console.error("No playlist ID provided");
      return;
    }

    // Retrieve userBackend from IndexedDB
    const userBackend = await getUserBackend();
    if (!userBackend || !userBackend.backendUser.generatedPlaylists[playlistId]) {
      console.error("Playlist not found");
      return;
    }

    // Fetch the correct playlist
    const playlist = userBackend.backendUser.generatedPlaylists[playlistId];
    console.log("Fetched Playlist:", playlist);

    // Display the playlist
    displayPlaylist(playlist);
  } catch (error) {
    console.error("Error fetching playlist from IndexedDB:", error);
  }
}

// helper function to get query parameters from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function displayPlaylist(playlist) {
  const container = document.querySelector('.playlist-container');
  container.innerHTML = ''; // Clear previous content

  const playlistTitle = document.getElementById('playlistTitle');
  playlistTitle.textContent = `Your Generated Playlist: ${playlist.name}`;

  playlist.songs.forEach(song => {
    const songElement = document.createElement('p');

    const songNameElement = document.createElement('strong');
    songNameElement.textContent = song.name;

    songElement.appendChild(songNameElement);
    songElement.appendChild(document.createTextNode(` by ${song.artist}`));

    container.appendChild(songElement);
  });

  // Populate and handle playlist selection dropdown
  setupPlaylistDropdown();
}

async function setupPlaylistDropdown() {
  const userBackend = await getUserBackend();
  if (!userBackend) return;

  const dropdown = document.getElementById("playlist-dropdown");
  dropdown.innerHTML = userBackend.backendUser.generatedPlaylists
    .map((_, index) => `<option value="${index}">Playlist ${index + 1}</option>`)
    .join("");

  // Set dropdown to current playlistId
  const playlistId = getQueryParam("playlistId");
  if (playlistId !== null) {
    dropdown.value = playlistId;
  }

  // Redirect to selected playlist when dropdown changes
  dropdown.addEventListener("change", (event) => {
    window.location.href = `playlist.html?playlistId=${event.target.value}`;
  });
}
