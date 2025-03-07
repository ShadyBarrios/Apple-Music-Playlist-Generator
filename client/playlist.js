import { getUserBackend } from "./indexedDB.js";

// Global variables to track current audio, button, and playlist
let currentAudio = null;
let currentPlayingButton = null;
let currentPlaylist = null;
let currentSortMethod = "shuffle"; // Track the current sort method

// Constants for time calculations
const AVERAGE_SONG_DURATION_MINUTES = 3.5; // Average song duration in minutes

document.addEventListener("DOMContentLoaded", async () => {
  showLoading();
  await fetchPlaylist();
  hideLoading();
  
  // Simplified animation - just make elements visible without staggered delay
  document.querySelectorAll('.playlist-selector, .button-container, #playlistTitle, .filters-display-container, .playlist-stats-container, .detailed-stats-container, .sorting-options, .playlist-container').forEach(element => {
    element.style.opacity = '1';
  });

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
      currentSortMethod = "shuffle";
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
    case "shuffle":
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
  
  // Update playlist stats
  updatePlaylistStats(playlist.songs);
  
  // Update detailed playlist stats
  updateDetailedStats(playlist.songs);

  // Sort the songs based on current sort method
  const sortedSongs = sortSongs(playlist.songs);

  // For each song, create a flex row with album artwork, song info and a play/stop button
  sortedSongs.forEach((song, index) => {
    displaySong(song, index, container);
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
  // If there's already a song playing, stop it
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    
    // Reset the previous button
    if (currentPlayingButton) {
      currentPlayingButton.classList.remove("playing");
      
      // Reset button text and icon
      const prevButtonIcon = currentPlayingButton.querySelector("i");
      const prevButtonText = currentPlayingButton.querySelector("span");
      
      if (prevButtonIcon) {
        prevButtonIcon.classList.remove("fa-stop");
        prevButtonIcon.classList.add("fa-play");
      }
      
      if (prevButtonText) {
        prevButtonText.textContent = " Play";
      }
    }
    
    // If the same button was clicked, just stop playing and return
    if (currentPlayingButton === button) {
      currentPlayingButton = null;
      return;
    }
  }
  
  // If the song has a preview URL, play it
  if (song.previewUrl) {
    currentAudio = new Audio(song.previewUrl);
    currentAudio.play();
    currentPlayingButton = button;
    button.classList.add("playing");
    
    // Update button text and icon
    const buttonIcon = button.querySelector("i");
    const buttonText = button.querySelector("span");
    
    if (buttonIcon) {
      buttonIcon.classList.remove("fa-play");
      buttonIcon.classList.add("fa-stop");
    }
    
    if (buttonText) {
      buttonText.textContent = " Stop";
    }
    
    // Add ripple effect
    const ripple = document.createElement("span");
    ripple.classList.add("button-ripple");
    button.appendChild(ripple);
    
    // Remove ripple after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 800);
    
    // When the audio ends, reset the button
    currentAudio.addEventListener("ended", () => {
      button.classList.remove("playing");
      
      // Reset button text and icon
      if (buttonIcon) {
        buttonIcon.classList.remove("fa-stop");
        buttonIcon.classList.add("fa-play");
      }
      
      if (buttonText) {
        buttonText.textContent = " Play";
      }
      
      currentAudio = null;
      currentPlayingButton = null;
    });
  } else {
    // If no preview URL, show an alert
    alert("No preview available for this song.");
  }
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

// Function to update playlist stats
function updatePlaylistStats(songs) {
  // Get the stats elements
  const songCountElement = document.getElementById("song-count");
  const totalDurationElement = document.getElementById("total-duration");
  const listeningTimeElement = document.getElementById("listening-time");
  
  // Calculate stats
  const songCount = songs.length;
  const totalDurationMinutes = Math.round(songCount * AVERAGE_SONG_DURATION_MINUTES);
  
  // Format the listening time in hours and minutes if over 60 minutes
  let listeningTimeFormatted;
  if (totalDurationMinutes >= 60) {
    const hours = Math.floor(totalDurationMinutes / 60);
    const minutes = totalDurationMinutes % 60;
    listeningTimeFormatted = `${hours} hr ${minutes} min`;
  } else {
    listeningTimeFormatted = `${totalDurationMinutes} min`;
  }
  
  // Update the elements
  songCountElement.textContent = songCount;
  totalDurationElement.textContent = `${totalDurationMinutes} min`;
  listeningTimeElement.textContent = listeningTimeFormatted;
}

// Helper function to extract genre name from various possible data structures
function extractGenreName(genreData) {
  // If it's a string, return it directly
  if (typeof genreData === 'string') {
    return genreData;
  }
  
  // If it's null or undefined, return Unknown
  if (genreData === null || genreData === undefined) {
    return 'Unknown';
  }
  
  // If it's an object, try to extract the name based on Apple Music API structure
  if (typeof genreData === 'object') {
    // Apple Music API structure: { id: "123", attributes: { name: "Rock" } }
    if (genreData.attributes && genreData.attributes.name) {
      return genreData.attributes.name;
    }
    
    // Direct name property
    if (genreData.name) {
      return genreData.name;
    }
    
    // Other common properties
    if (genreData.genre) {
      return genreData.genre;
    }
    
    if (genreData.value) {
      return genreData.value;
    }
    
    if (genreData.id) {
      return genreData.id;
    }
    
    // If it has a toString method that doesn't return [object Object]
    if (genreData.toString && genreData.toString() !== '[object Object]') {
      return genreData.toString();
    }
    
    // Try to get the first key-value pair if it's a simple object
    const keys = Object.keys(genreData);
    if (keys.length > 0) {
      const firstValue = genreData[keys[0]];
      if (typeof firstValue === 'string') {
        return firstValue;
      }
    }
  }
  
  // If all else fails, return Unknown
  return 'Unknown';
}

// Function to update detailed playlist stats
function updateDetailedStats(songs) {
  if (!songs || songs.length === 0) return;
  
  // Calculate top artist
  const artistCounts = {};
  songs.forEach(song => {
    artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
  });
  
  // Find the artist with the most songs
  let topArtist = '';
  let topArtistCount = 0;
  
  Object.entries(artistCounts).forEach(([artist, count]) => {
    if (count > topArtistCount) {
      topArtist = artist;
      topArtistCount = count;
    }
  });

  const uniqueArtists = Object.keys(artistCounts).length;
  
  // Update the DOM elements
  document.getElementById('top-artist').textContent = topArtist;
  document.getElementById('top-artist-count').textContent = topArtistCount;
  document.getElementById('unique-artists').textContent = `${uniqueArtists} different artists`;
}

// Function to create and display a song row
function displaySong(song, index, container) {
  // Create song row container
  const songRow = document.createElement("div");
  songRow.classList.add("song-row");
  songRow.setAttribute("data-index", index);
  
  // Song number
  const songNumber = document.createElement("div");
  songNumber.classList.add("song-number");
  songNumber.textContent = index + 1;
  songRow.appendChild(songNumber);

  // Artwork container
  const artworkContainer = document.createElement("div");
  artworkContainer.classList.add("artwork-container");
  
  // Check if artwork URL exists
  if (song.artworkUrl) {
    const artwork = document.createElement("img");
    artwork.src = song.artworkUrl;
    artwork.alt = `${song.name} artwork`;
    artwork.classList.add("song-artwork");
    
    artworkContainer.appendChild(artwork);
    songRow.appendChild(artworkContainer);
  } else {
    // If no artwork, add a placeholder with music icon
    const artworkPlaceholder = document.createElement("div");
    artworkPlaceholder.classList.add("artwork-placeholder");
    
    // Add music icon
    const musicIcon = document.createElement("i");
    musicIcon.classList.add("fas", "fa-music");
    artworkPlaceholder.appendChild(musicIcon);
    
    songRow.appendChild(artworkPlaceholder);
  }

  // Song info container
  const songInfo = document.createElement("div");
  songInfo.classList.add("song-info");
  
  // Song name
  const songNameElement = document.createElement("strong");
  songNameElement.classList.add("song-name");
  songNameElement.textContent = song.name;
  
  // Artist name
  const artistElement = document.createElement("span");
  artistElement.classList.add("artist-name");
  artistElement.textContent = ` by ${song.artist}`;
  
  // Add genre tags if available
  const genreContainer = document.createElement("div");
  genreContainer.classList.add("genre-tags");
  
  const genreTag = document.createElement("span");
  genreTag.classList.add("genre-tag");
  
  // Use the helper function to get subgenres (or genres) present in playlist AND song
  const genreText = intersectFiltersAndSong(song, currentPlaylist.filters);
  
  genreTag.textContent = genreText;
  genreContainer.appendChild(genreTag);
  
  
  songInfo.appendChild(songNameElement);
  songInfo.appendChild(artistElement);
  songInfo.appendChild(genreContainer);
  songRow.appendChild(songInfo);

  // Play/Stop button container
  const playButton = document.createElement("button");
  playButton.classList.add("play-button");
  
  // Add play icon
  const buttonIcon = document.createElement("i");
  buttonIcon.classList.add("fas", "fa-play");
  playButton.appendChild(buttonIcon);
  
  // Add button text
  const buttonText = document.createElement("span");
  buttonText.textContent = " Play";
  playButton.appendChild(buttonText);
  
  playButton.addEventListener("click", () => {
    playSnippet(song, playButton);
  });
  songRow.appendChild(playButton);

  container.appendChild(songRow);
}

// gets all subgenres (or genres if no subgenres chosen) present in both the playlist and the song
function intersectFiltersAndSong(song, filters){
  const subgenres = Array.from(song.subgenres);
  const genres = Array.from(song.genres);

  const intersectSubgenres = subgenres.filter(subgenre => filters.includes(subgenre));
  const intersectGenres = genres.filter(genre => filters.includes(genre));

  const result = intersectSubgenres.length > 0 ? intersectSubgenres : intersectGenres;

  const reduced = result.length > 5 ? result.slice(0, 5) : result;
  const string = reduced.join(" | ");

  return string;
}