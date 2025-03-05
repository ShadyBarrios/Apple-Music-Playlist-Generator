import { storeUserBackend, getUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

document.addEventListener("DOMContentLoaded", async () => {
  await fetchPlaylist();
});

async function fetchPlaylist() {
  let userBackend = null;
  try {
    // Retrieve userBackend from IndexedDB
    userBackend = await getUserBackend();

    if (!userBackend) {
      console.error("No userBackend");
      return;
    }

    const playlistId = userBackend.backendUser.generatedPlaylists.length - 1
    // fetch the correct playlist
    const playlist = userBackend.backendUser.generatedPlaylists[playlistId];
    console.log("Fetched Playlist:", playlist);

    // Display the playlist
    displayPlaylist(playlist);
  } catch (error) {
    console.error("Error fetching playlist from IndexedDB:", error);
  }
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
