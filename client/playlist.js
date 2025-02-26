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
    //displayPlaylist(data.playlist);
  } catch (error) {
    console.error("Error generating playlist:", error);
    update_loading_status("Error loading playlist");
  }
}

function displayPlaylist(playlist) {
  const container = document.querySelector('.playlist-container');
  container.innerHTML = playlist.map(song => `<p>${song}</p>`).join('');
}

function update_loading_status(status) {
  const statusElement = document.getElementById("loading_status");
  const loadingAnimate = document.getElementById("loading_animate");

  if (statusElement) statusElement.innerText = status;
  if (loadingAnimate) loadingAnimate.style.display = status === "Loading..." ? "block" : "none";
}
