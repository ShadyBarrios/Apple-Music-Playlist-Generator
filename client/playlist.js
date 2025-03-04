// import {UserBackend} from '../src/backend.js';

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Playlist Page Loaded");

  await fetchPlaylist();

  const saveBtn = document.getElementById("savePlaylistBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", savePlaylist);
  } else {
    console.error("Error: savePlaylistBtn not found in DOM");
  }
});

async function fetchPlaylist() {
  try {
    const response = await fetch('/generate-playlist', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to generate playlist');

    const data = await response.json();
    console.log("Generated Playlist Data:", data); // Debugging

    if (!data || !data.playlist || !data.playlist.name) {
      console.error("Error: Playlist name is missing in response");
      alert("Error: Playlist title is missing from response.");
      return;
    }

    const playlistNameElement = document.getElementById("playlistName");
    if (!playlistNameElement) {
      console.error("Error: playlistName element is missing in the DOM");
      return;
    }

    playlistNameElement.textContent = data.playlist.name;
    storedSongs = data.playlist.songs;//full song data
    displayPlaylist(data.playlist);
  } catch (error) {
    console.error("Error generating playlist:", error);
  }
}



function displayPlaylist(playlist) {
  const container = document.querySelector('.playlist-container');
  container.innerHTML = ''; // Clear previous content

  // Display playlist name in the header
  const playlistTitle = document.getElementById('playlistTitle');
  playlistTitle.textContent = `Your Generated Playlist: ${playlist.name}`;

  // Display each song in the playlist
  playlist.songs.forEach(song => {
    const songElement = document.createElement('p');
    
    // Create a bold element for the song name
    const songNameElement = document.createElement('strong');
    songNameElement.textContent = song.name;

    // Append song name and artist text
    songElement.appendChild(songNameElement);
    songElement.appendChild(document.createTextNode(` by ${song.artist}`));

    container.appendChild(songElement);
  });
}

async function savePlaylist() {
  try {
    const playlistNameElement = document.getElementById('playlistTitle');
    if (!playlistNameElement) {
      console.error("Error: playlistName element not found in DOM");
      alert("Error: Playlist title is missing.");
      return;
    }

    const playlistName = playlistNameElement.textContent;
    const songElements = document.querySelectorAll(".playlist-container p");
    
    if (songElements.length === 0) {
      alert("No songs in the playlist to save!");
      return;
    }

    const songs = Array.from(songElements).map(songElement => {
      const songText = songElement.textContent;
      const [name, artist] = songText.split(" by ");
      return { name: name.trim(), artist: artist.trim() };
    });
    
    console.log("🛠 Sending data to /send-playlist:", JSON.stringify({ name: playlistName, songs: storedSongs }, null, 2));
    const response = await fetch('/send-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playlistName, songs: storedSongs})
    });

    if (!response.ok) throw new Error("Failed to save playlist");

    alert("Playlist saved to Apple Music!");
  } catch (error) {
    console.error("Error saving playlist:", error);
    alert("Error saving playlist. Please try again.");
  }
}