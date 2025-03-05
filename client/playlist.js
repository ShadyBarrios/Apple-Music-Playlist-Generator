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
  
  // Simplified animation - just make elements visible without staggered delay
  document.querySelectorAll('.playlist-selector, .button-container, #playlistTitle, .filters-display-container, .playlist-stats-container, .chart-container, .detailed-stats-container, .sorting-options, .playlist-container').forEach(element => {
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
    
    // Add detailed logging for genre data structure
    if (playlist && playlist.songs && playlist.songs.length > 0) {
      console.log("First song:", playlist.songs[0]);
      console.log("First song genres:", playlist.songs[0].genres);
      if (playlist.songs[0].genres && playlist.songs[0].genres.length > 0) {
        console.log("First genre type:", typeof playlist.songs[0].genres[0]);
        console.log("First genre value:", playlist.songs[0].genres[0]);
        console.log("First genre JSON:", JSON.stringify(playlist.songs[0].genres[0]));
      }
    }

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
  
  // Debug: Log the first song's genres to understand structure
  if (songs.length > 0) {
    console.log("First song in updateGenreChart:", songs[0]);
    console.log("First song genres:", songs[0].genres);
    if (songs[0].genres && songs[0].genres.length > 0) {
      console.log("First genre in updateGenreChart:", songs[0].genres[0]);
      console.log("First genre type:", typeof songs[0].genres[0]);
      console.log("First genre JSON:", JSON.stringify(songs[0].genres[0]));
      console.log("Extracted genre name:", extractGenreName(songs[0].genres[0]));
    }
  }
  
  // Process each song
  songs.forEach(song => {
    // Handle case where genres might be a string instead of an array
    const genres = Array.isArray(song.genres) ? song.genres : (song.genres ? [song.genres] : []);
    const subgenres = Array.isArray(song.subgenres) ? song.subgenres : (song.subgenres ? [song.subgenres] : []);
    
    // Use the first genre for each song (if available)
    if (genres.length > 0) {
      // Extract genre name based on possible data structures
      let genre = extractGenreName(genres[0]);
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    } else if (subgenres.length > 0) {
      // If no genres, use the first subgenre
      let subgenre = extractGenreName(subgenres[0]);
      genreCounts[subgenre] = (genreCounts[subgenre] || 0) + 1;
    } else {
      // If no genres or subgenres, count as "Unknown"
      genreCounts["Unknown"] = (genreCounts["Unknown"] || 0) + 1;
    }
  });
  
  // Debug: Log the genre counts
  console.log("Genre counts:", genreCounts);
  
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
  
  // Handle case where genres might be a string instead of an array
  const genres = Array.isArray(song.genres) ? song.genres : (song.genres ? [song.genres] : []);
  
  if (genres.length > 0) {
    // Debug: Log genre data for the first song
    if (index === 0) {
      console.log("First song in displaySong:", song);
      console.log("First song genres in displaySong:", genres);
      console.log("First genre in displaySong:", genres[0]);
      console.log("Extracted genre name in displaySong:", extractGenreName(genres[0]));
    }
    
    const genreTag = document.createElement("span");
    genreTag.classList.add("genre-tag");
    
    // Use the helper function to extract genre name
    const genreText = extractGenreName(genres[0]);
    
    genreTag.textContent = genreText;
    genreContainer.appendChild(genreTag);
  }
  
  songInfo.appendChild(songNameElement);
  songInfo.appendChild(artistElement);
  songInfo.appendChild(genreContainer);
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
