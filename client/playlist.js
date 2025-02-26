document.addEventListener("DOMContentLoaded", async () => {
  console.log("Playlist Page Loaded");
  update_loading_status("Loading...");
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

    update_loading_status("Loaded");
    displayPlaylist(data.playlist);
  } catch (error) {
    console.error("Error generating playlist:", error);
    update_loading_status("Error loading playlist");
  }
}

function displayPlaylist(playlist) {
  const container = document.querySelector('.playlist-container');
  container.innerHTML = ''; // Clear previous content

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

function update_loading_status(status) {
  const statusElement = document.getElementById("loading_status");
  const loadingAnimate = document.getElementById("loading_animate");

  if (statusElement) statusElement.innerText = status;
  if (loadingAnimate) loadingAnimate.style.display = status === "Loading..." ? "block" : "none";
}
