import { storeUserBackend, getUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

// Global variable to keep track of the currently playing audio snippet
let currentAudio = null;

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
  try {
    // Retrieve userBackend from IndexedDB
    const userBackend = await getUserBackend();
    if (!userBackend) {
      console.error("No userBackend found in IndexedDB");
      return;
    }

    // Use the last generated playlist as default
    const defaultIndex = userBackend.backendUser.generatedPlaylists.length - 1;
    const playlist = userBackend.backendUser.generatedPlaylists[defaultIndex];
    console.log("Fetched Playlist:", playlist);

    // Display the default playlist
    displayPlaylist(playlist);

    // Set up the dropdown with all playlists and select the default one
    setupPlaylistDropdown(userBackend.backendUser.generatedPlaylists, defaultIndex);
  } catch (error) {
    console.error("Error fetching playlist from IndexedDB:", error);
  }
}

function displayPlaylist(playlist) {
  const container = document.querySelector(".playlist-container");
  container.innerHTML = ""; // Clear previous content

  // Update the playlist title
  const playlistTitle = document.getElementById("playlistTitle");
  playlistTitle.textContent = `Your Generated Playlist: ${playlist.name}`;

  // Update the playlist name span (if used elsewhere)
  const playlistNameSpan = document.getElementById("playlistName");
  if (playlistNameSpan) {
    playlistNameSpan.textContent = playlist.name;
  }

  // For each song, create a container with song info and a "Play Snippet" button
  playlist.songs.forEach((song) => {
    // Create a row container for the song
    const songRow = document.createElement("div");
    songRow.classList.add("song-row");

    // Create an element to display song info (name and artist)
    const songInfo = document.createElement("p");
    const songNameElement = document.createElement("strong");
    songNameElement.textContent = song.name;
    songInfo.appendChild(songNameElement);
    songInfo.appendChild(document.createTextNode(` by ${song.artist}`));
    songRow.appendChild(songInfo);

    // Create the "Play Snippet" button
    const playButton = document.createElement("button");
    playButton.classList.add("play-button");
    playButton.textContent = "Play Snippet";
    playButton.addEventListener("click", () => {
      playSnippet(song);
    });
    songRow.appendChild(playButton);

    container.appendChild(songRow);
  });
}

function setupPlaylistDropdown(playlists, currentIndex) {
  const dropdown = document.getElementById("playlist-dropdown");
  if (!dropdown) return;

  dropdown.innerHTML = playlists
    .map(
      (playlist, index) =>
        `<option value="${index}" ${index === currentIndex ? "selected" : ""}>
          Playlist ${index + 1}: ${playlist.name}
         </option>`
    )
    .join("");

  // When the dropdown selection changes, update the displayed playlist
  dropdown.addEventListener("change", async (event) => {
    const selectedIndex = parseInt(event.target.value, 10);
    const userBackend = await getUserBackend();
    if (!userBackend) return;
    const playlist = userBackend.backendUser.generatedPlaylists[selectedIndex];
    displayPlaylist(playlist);
  });
}

function playSnippet(song) {
  // Check if a preview URL is available in the song object
  if (!song.previewUrl) {
    alert("Preview not available for this song.");
    return;
  }
  // Pause any currently playing snippet
  if (currentAudio) {
    currentAudio.pause();
  }
  // Create a new audio element with the song's preview URL and play it
  currentAudio = new Audio(song.previewUrl);
  currentAudio.play();
}
