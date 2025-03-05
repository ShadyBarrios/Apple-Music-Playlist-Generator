import { storeUserBackend, getUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

// Global variables to track current audio, button, and playlist
let currentAudio = null;
let currentPlayingButton = null;
let currentPlaylist = null;
let currentSortMethod = "default"; // Track the current sort method
let genreChart = null; // Variable to store the chart instance

// Constants for time calculations
const AVERAGE_SONG_DURATION_MINUTES = 3.5; // Average song duration in minutes

// Chart colors
const CHART_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#8AC249', '#EA5F89', '#00D8B6', '#FFB7B2'
];

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
  const sortPopularityButton = document.getElementById("sort-popularity");
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

  if (sortPopularityButton) {
    sortPopularityButton.addEventListener("click", () => {
      setActiveSortButton(sortPopularityButton);
      currentSortMethod = "popularity";
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
    case "popularity":
      return songsCopy.sort((a, b) => b.popularity - a.popularity); // Sort by popularity (high to low)
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
  
  // Update playlist stats
  updatePlaylistStats(playlist.songs);
  
  // Update genre distribution chart
  updateGenreChart(playlist.songs);
  
  // Update detailed playlist stats
  updateDetailedStats(playlist.songs);

  // Sort the songs based on current sort method
  const sortedSongs = sortSongs(playlist.songs);

  // For each song, create a flex row with album artwork, song info, popularity indicator and a play/stop button
  sortedSongs.forEach((song) => {
    const songRow = document.createElement("div");
    songRow.classList.add("song-row");

    // Album artwork container
    if (song.artworkUrl) {
      const artworkContainer = document.createElement("div");
      artworkContainer.classList.add("artwork-container");
      
      const artwork = document.createElement("img");
      artwork.src = song.artworkUrl;
      artwork.alt = `${song.name} album artwork`;
      artwork.classList.add("song-artwork");
      
      artworkContainer.appendChild(artwork);
      songRow.appendChild(artworkContainer);
    } else {
      // If no artwork, add a placeholder
      const artworkPlaceholder = document.createElement("div");
      artworkPlaceholder.classList.add("artwork-placeholder");
      songRow.appendChild(artworkPlaceholder);
    }

    // Song info container
    const songInfo = document.createElement("div");
    songInfo.classList.add("song-info");
    const songNameElement = document.createElement("strong");
    songNameElement.textContent = song.name;
    songInfo.appendChild(songNameElement);
    songInfo.appendChild(document.createTextNode(` by ${song.artist}`));
    songRow.appendChild(songInfo);

    // Popularity indicator container
    const popularityContainer = document.createElement("div");
    popularityContainer.classList.add("popularity-container");
    
    // Create the popularity bar
    const popularityBar = document.createElement("div");
    popularityBar.classList.add("popularity-bar");
    
    // Create the filled portion of the bar based on popularity score
    const popularityFill = document.createElement("div");
    popularityFill.classList.add("popularity-fill");
    popularityFill.style.width = `${song.popularity}%`;
    
    // Set color based on popularity score
    if (song.popularity >= 80) {
      popularityFill.classList.add("high-popularity");
    } else if (song.popularity >= 50) {
      popularityFill.classList.add("medium-popularity");
    } else {
      popularityFill.classList.add("low-popularity");
    }
    
    // Add tooltip with exact popularity score
    popularityContainer.setAttribute("title", `Popularity: ${song.popularity}/100`);
    
    popularityBar.appendChild(popularityFill);
    popularityContainer.appendChild(popularityBar);
    songRow.appendChild(popularityContainer);

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

// Function to update genre distribution chart
function updateGenreChart(songs) {
  // Get the canvas element
  const ctx = document.getElementById('genre-chart');
  
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (genreChart) {
    genreChart.destroy();
  }
  
  // Count genres
  const genreCounts = {};
  
  // Process each song
  songs.forEach(song => {
    // Use the first genre for each song (if available)
    if (song.genres && song.genres.length > 0) {
      const genre = song.genres[0];
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    } else if (song.subgenres && song.subgenres.length > 0) {
      // If no genres, use the first subgenre
      const subgenre = song.subgenres[0];
      genreCounts[subgenre] = (genreCounts[subgenre] || 0) + 1;
    } else {
      // If no genres or subgenres, count as "Unknown"
      genreCounts["Unknown"] = (genreCounts["Unknown"] || 0) + 1;
    }
  });
  
  // Sort genres by count (descending)
  const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
  
  // Take top 5 genres, combine the rest as "Other"
  const topGenres = sortedGenres.slice(0, 5);
  const otherGenres = sortedGenres.slice(5);
  
  // Prepare data for the chart
  const labels = [...topGenres];
  const data = topGenres.map(genre => genreCounts[genre]);
  
  // Add "Other" category if there are more than 5 genres
  if (otherGenres.length > 0) {
    labels.push('Other');
    const otherCount = otherGenres.reduce((sum, genre) => sum + genreCounts[genre], 0);
    data.push(otherCount);
  }
  
  // Create the chart
  genreChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} songs (${percentage}%)`;
            }
          }
        }
      }
    }
  });
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
  
  // Calculate average popularity
  const totalPopularity = songs.reduce((sum, song) => sum + song.popularity, 0);
  const avgPopularity = Math.round(totalPopularity / songs.length);
  
  // Calculate artist variety
  const uniqueArtists = Object.keys(artistCounts).length;
  const artistVariety = Math.round((uniqueArtists / songs.length) * 100);
  
  // Calculate genre variety
  const allGenres = new Set();
  songs.forEach(song => {
    if (song.genres && song.genres.length > 0) {
      song.genres.forEach(genre => allGenres.add(genre));
    }
    if (song.subgenres && song.subgenres.length > 0) {
      song.subgenres.forEach(subgenre => allGenres.add(subgenre));
    }
  });
  const uniqueGenres = allGenres.size;
  const genreVariety = Math.min(100, Math.round((uniqueGenres / songs.length) * 100));
  
  // Update the DOM elements
  document.getElementById('top-artist').textContent = topArtist;
  document.getElementById('top-artist-count').textContent = topArtistCount;
  
  document.getElementById('avg-popularity').textContent = `Average: ${avgPopularity}%`;
  const popularityFill = document.getElementById('popularity-fill');
  if (popularityFill) {
    popularityFill.style.width = `${avgPopularity}%`;
    
    // Set color based on popularity
    popularityFill.style.background = getPopularityGradient(avgPopularity);
  }
  
  document.getElementById('unique-artists').textContent = `${uniqueArtists} different artists`;
  document.getElementById('artist-variety').textContent = `${artistVariety}%`;
  
  document.getElementById('unique-genres').textContent = `${uniqueGenres} different genres`;
  document.getElementById('genre-variety').textContent = `${genreVariety}%`;
}

// Helper function to get a color gradient based on popularity
function getPopularityGradient(popularity) {
  if (popularity >= 80) {
    return 'linear-gradient(90deg, #ff9a9e 0%, #fad0c4 100%)'; // High popularity (reddish)
  } else if (popularity >= 60) {
    return 'linear-gradient(90deg, #fad0c4 0%, #ffd1ff 100%)'; // Medium-high popularity (pink)
  } else if (popularity >= 40) {
    return 'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)'; // Medium popularity (blue)
  } else if (popularity >= 20) {
    return 'linear-gradient(90deg, #d4fc79 0%, #96e6a1 100%)'; // Medium-low popularity (green)
  } else {
    return 'linear-gradient(90deg, #e0c3fc 0%, #8ec5fc 100%)'; // Low popularity (purple)
  }
}
