import { storeUserBackend, getUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

document.addEventListener("DOMContentLoaded", async () => {
  await fetchPlaylist();

  // Add event listener for the Regenerate Playlist button
  const regenerateButton = document.getElementById("regenerate-button");
  if (regenerateButton) {
    regenerateButton.addEventListener("click", () => {
      // Redirect to filters.html so the user can reselect filters and generate a new playlist
      window.location.href = "filters.html";
    });
  }
});

async function fetchPlaylist() {
  let userBackend = null;
  try {
    // Retrieve userBackend from IndexedDB
    userBackend = await getUserBackend();

    if (!userBackend) {
      console.error("No userBackend found in IndexedDB");
      return;
    }

    // Get the most recently generated playlist
    const playlistId = userBackend.backendUser.generatedPlaylists.length - 1;
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

  // Update the playlist title with the playlist name
  const playlistTitle = document.getElementById('playlistTitle');
  playlistTitle.textContent = `Your Generated Playlist: ${playlist.name}`;

  // Create elements for each song in the playlist
  playlist.songs.forEach(song => {
    const songElement = document.createElement('p');

    const songNameElement = document.createElement('strong');
    songNameElement.textContent = song.name;

    songElement.appendChild(songNameElement);
    songElement.appendChild(document.createTextNode(` by ${song.artist}`));

    container.appendChild(songElement);
  });

  // Optionally, populate and handle the playlist selection dropdown if it exists
  setupPlaylistDropdown();
}

async function setupPlaylistDropdown() {
  const userBackend = await getUserBackend();
  if (!userBackend) return;

  const dropdown = document.getElementById("playlist-dropdown");
  if (!dropdown) return;

  dropdown.innerHTML = userBackend.backendUser.generatedPlaylists
    .map((_, index) => `<option value="${index}">Playlist ${index + 1}</option>`)
    .join("");

  // Set dropdown to the current playlist if a query parameter is provided
  const playlistId = getQueryParam("playlistId");
  if (playlistId !== null) {
    dropdown.value = playlistId;
  }

  // Redirect to the selected playlist when the dropdown changes
  dropdown.addEventListener("change", (event) => {
    window.location.href = `playlist.html?playlistId=${event.target.value}`;
  });
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
