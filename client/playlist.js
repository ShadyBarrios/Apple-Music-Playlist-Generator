document.addEventListener("DOMContentLoaded", async () => {
  console.log("Playlist Page Loaded");
  await fetchPlaylist();
});

async function fetchPlaylist() {
  
  try {
    const response = await fetch('/generate-playlist', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to generate playlist');

    const data = await response.json();
    console.log("Generated Playlist:", data);

    // Display the playlist
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
