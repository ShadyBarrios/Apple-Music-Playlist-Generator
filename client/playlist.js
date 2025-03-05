import { storeUserBackend, getUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

// Global variables to track current audio, button, and playlist
let currentAudio = null;
let currentPlayingButton = null;
let currentPlaylist = null;
let currentSortMethod = "default"; // Track the current sort method

document.addEventListener("DOMContentLoaded", async () => {
  showLoading();
  await fetchPlaylist();
  hideLoading();

  // Add event listener for the Regenerate Playlist button
  const regenerateButton = document.getElementById("regenerate-button");
  if (regenerateButton) {
    regenerateButton.addEventListener("click", () => {
      showLoading();
      window.location.href = "filters.html";
    });
  }

  // Add event listener for the Send Playlist button
  const sendButton = document.getElementById("send-playlist-button");
  if (sendButton) {
    sendButton.addEventListener("click", sendPlaylistToLibrary);
  }

  // Add event listeners for sorting buttons
  setupSortingButtons();
});

// Function to show loading overlay
function showLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.add("active");
  }
}

// Function to hide loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.remove("active");
  }
}

// Setup sorting buttons
function setupSortingButtons() {
  const sortTitleButton = document.getElementById("sort-title");
  const sortArtistButton = document.getElementById("sort-artist");
  const sortDefaultButton = document.getElementById("sort-default");

  if (sortTitleButton) {
    sortTitleButton.addEventListener("click", () => {
      setActiveSortButton(sortTitleButton);
      currentSortMethod = "title";
      if (currentPlaylist) {
        displayPlaylist(currentPlaylist);
      }
    });
  }

  if (sortArtistButton) {
    sortArtistButton.addEventListener("click", () => {
      setActiveSortButton(sortArtistButton);
      currentSortMethod = "artist";
      if (currentPlaylist) {
        displayPlaylist(currentPlaylist);
      }
    });
  }

  if (sortDefaultButton) {
    sortDefaultButton.addEventListener("click", () => {
      setActiveSortButton(sortDefaultButton);
      currentSortMethod = "default";
      if (currentPlaylist) {
        displayPlaylist(currentPlaylist);
      }
    });
  }
}

// Set active sort button
function setActiveSortButton(activeButton) {
  const sortButtons = document.querySelectorAll(".sort-button");
  sortButtons.forEach(button => {
    button.classList.remove("active");
  });
  activeButton.classList.add("active");
}

// Sort songs based on current sort method
function sortSongs(songs) {
  const songsCopy = [...songs]; // Create a copy to avoid modifying the original
  
  switch (currentSortMethod) {
    case "title":
      return songsCopy.sort((a, b) => a.name.localeCompare(b.name));
    case "artist":
      return songsCopy.sort((a, b) => a.artist.localeCompare(b.artist));
    case "default":
    default:
      return songsCopy; // Return the original order
  }
}

async function fetchPlaylist() {
  try {
    const userBackend = await getUserBackend();
    if (!userBackend) {
      console.error("No userBackend found in IndexedDB");
      return;
    }

    // Use the last generated playlist as default
    const defaultIndex = userBackend.backendUser.generatedPlaylists.length - 1;
    const playlist = userBackend.backendUser.generatedPlaylists[defaultIndex];
    console.log("Fetched Playlist:", playlist);

    // Save current playlist in a global variable
    currentPlaylist = playlist;

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
  container.innerHTML = "";

  // Update playlist title and name span
  const playlistTitle = document.getElementById("playlistTitle");
  playlistTitle.textContent = `Your Generated Playlist: ${playlist.name}`;
  const playlistNameSpan = document.getElementById("playlistName");
  if (playlistNameSpan) {
    playlistNameSpan.textContent = playlist.name;
  }

  // Display the filters
  displayFilters(playlist.filters);

  // Sort the songs based on current sort method
  const sortedSongs = sortSongs(playlist.songs);

  // For each song, create a flex row with song info and a play/stop button
  sortedSongs.forEach((song) => {
    const songRow = document.createElement("div");
    songRow.classList.add("song-row");

    // Song info container
    const songInfo = document.createElement("div");
    songInfo.classList.add("song-info");
    const songNameElement = document.createElement("strong");
    songNameElement.textContent = song.name;
    songInfo.appendChild(songNameElement);
    songInfo.appendChild(document.createTextNode(` by ${song.artist}`));
    songRow.appendChild(songInfo);

    // Play/Stop button container
    const playButton = document.createElement("button");
    playButton.classList.add("play-button");
    playButton.textContent = "Play";
    playButton.addEventListener("click", () => {
      playSnippet(song, playButton);
    });
    songRow.appendChild(playButton);

    container.appendChild(songRow);
  });
}

// Function to display the filters
function displayFilters(filters) {
  const filtersList = document.getElementById("filters-list");
  if (!filtersList) return;
  
  filtersList.innerHTML = "";
  
  if (!filters || filters.length === 0) {
    const noFilters = document.createElement("p");
    noFilters.textContent = "No filters selected";
    filtersList.appendChild(noFilters);
    return;
  }
  
  // Create a tag for each filter
  filters.forEach(filter => {
    const filterTag = document.createElement("span");
    filterTag.classList.add("filter-tag");
    filterTag.textContent = filter;
    filtersList.appendChild(filterTag);
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

  dropdown.addEventListener("change", async (event) => {
    showLoading();
    const selectedIndex = parseInt(event.target.value, 10);
    const userBackend = await getUserBackend();
    if (!userBackend) {
      hideLoading();
      return;
    }
    const playlist = userBackend.backendUser.generatedPlaylists[selectedIndex];
    currentPlaylist = playlist; // update global currentPlaylist
    displayPlaylist(playlist);
    hideLoading();
  });
}

function playSnippet(song, button) {
  if (currentAudio && currentAudio.src === song.previewUrl && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    button.textContent = "Play";
    button.classList.remove("playing");
    currentAudio = null;
    currentPlayingButton = null;
    return;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentPlayingButton) {
      currentPlayingButton.textContent = "Play";
      currentPlayingButton.classList.remove("playing");
    }
  }
  if (!song.previewUrl) {
    alert("Preview not available for this song.");
    return;
  }
  currentAudio = new Audio(song.previewUrl);
  currentAudio.play();
  button.textContent = "Stop";
  button.classList.add("playing");
  currentPlayingButton = button;
  currentAudio.onended = function() {
    button.textContent = "Play";
    button.classList.remove("playing");
    currentAudio = null;
    currentPlayingButton = null;
  };
}

function sendPlaylistToLibrary() {
  if (!currentPlaylist) {
    alert("No playlist loaded.");
    return;
  }

  showLoading();

  // Prepare the payload using the current playlist's name and filters
  const payload = {
    playlistName: currentPlaylist.name,
    filters: currentPlaylist.filters,
  };

  fetch("/send-playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to send playlist to library.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Playlist sent to library:", data);
      hideLoading();
      alert("Playlist successfully sent to your library!");
    })
    .catch((error) => {
      console.error("Error sending playlist:", error);
      hideLoading();
      alert("Failed to send playlist to library.");
    });
}
