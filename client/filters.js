document.addEventListener("DOMContentLoaded", () => {
  let selectedGenres = new Set();
  let selectedSubGenres = new Set();
  
  async function fetchGenres() {
    try {
      const response = await fetch('/get-genres', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to fetch genres');
      const data = await response.json();
      console.log('Fetched Genres:', data);
      displayGenres(data.data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  }

  async function fetchSubGenres() {
    try {
      const response = await fetch('/get-subgenres', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to fetch sub-genres');
      const data = await response.json();
      console.log('Fetched Sub-Genres:', data);
      displaySubGenres(data.data);
    } catch (error) {
      console.error('Error fetching sub-genres:', error);
    }
  }

  function displayGenres(genres) {
    const genresContainer = document.querySelector('.genre-buttons');
    if (!genresContainer) return;

    let wrapper = document.querySelector('.genre-buttons-wrapper') || document.createElement('div');
    wrapper.classList.add('genre-buttons-wrapper');
    genresContainer.appendChild(wrapper);
    wrapper.innerHTML = '';

    genres.forEach(genre => {
      const button = document.createElement('button');
      button.innerText = genre;
      button.classList.toggle("selected", selectedGenres.has(genre));
      button.addEventListener('click', () => handleGenreClick(genre, button));
      wrapper.appendChild(button);
    });
  }

  function displaySubGenres(subGenres) {
    const subGenresContainer = document.querySelector('.subgenre-buttons');
    if (!subGenresContainer) return;

    let wrapper = document.querySelector('.subgenre-buttons-wrapper') || document.createElement('div');
    wrapper.classList.add('subgenre-buttons-wrapper');
    subGenresContainer.appendChild(wrapper);
    wrapper.innerHTML = '';

    subGenres.forEach(subGenre => {
      const button = document.createElement('button');
      button.innerText = subGenre;
      button.classList.toggle("selected", selectedSubGenres.has(subGenre));
      button.addEventListener('click', () => handleSubGenreClick(subGenre, button));
      wrapper.appendChild(button);
    });
  }

  function updateSelectedFilters() {
    const selectedFiltersList = document.querySelector(".selected-filters-list");
    if (!selectedFiltersList) return;
  
    selectedFiltersList.innerHTML = ""; // Clear current selections
  
    // Add selected genres
    selectedGenres.forEach(genre => {
      const listItem = document.createElement("li");
      listItem.innerText = genre;
      selectedFiltersList.appendChild(listItem);
    });
  
    // Add selected sub-genres
    selectedSubGenres.forEach(subGenre => {
      const listItem = document.createElement("li");
      listItem.innerText = subGenre;
      selectedFiltersList.appendChild(listItem);
    });
  }
  
  function handleGenreClick(genre, button) {
    if (selectedGenres.has(genre)) {
      selectedGenres.delete(genre);
      button.classList.remove("selected");
      button.style.backgroundColor = "#fc3c44"; // Reset color
    } else {
      selectedGenres.add(genre);
      button.classList.add("selected");
      button.style.backgroundColor = "#8B0000"; // Highlight selection
    }
    updateSelectedFilters();
  }
  
  function handleSubGenreClick(subGenre, button) {
    if (selectedSubGenres.has(subGenre)) {
      selectedSubGenres.delete(subGenre);
      button.classList.remove("selected");
      button.style.backgroundColor = "#fc3c44"; // Reset color
    } else {
      selectedSubGenres.add(subGenre);
      button.classList.add("selected");
      button.style.backgroundColor = "#8B0000"; // Highlight selection
    }
    updateSelectedFilters();
  }

  async function submitSelections() {
    const selectedData = {
      genres: Array.from(selectedGenres),
      subGenres: Array.from(selectedSubGenres),
    };
  
    if (selectedData.length === 0) {
      alert("Please select at least one filter to generate a playlist.");
      return;
    }
  
    // Ask user for the playlist name
    let playlistName = window.prompt("Please enter a name for your playlist:");
  
    if (!playlistName) {
      playlistName = "Guffle's Generated Playlist"; // default name
    }

    console.log("Submitting selections:", selectedData, playlistName);
  
    try {
      const response = await fetch('/submit-selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          genres: selectedData.genres,
          subGenres: selectedData.subGenres,
          name: playlistName
        }),
      });
  
      if (!response.ok) throw new Error('Failed to submit selections');
      
      const data = await response.json();
      console.log("Server Confrimation:", data.message);
  
      // Now trigger the playlist generation
      const playlistResponse = await fetch('/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistName: playlistName,
          filters: selectedData, // Send the filters for the playlist generation
        }),
      });
  
      if (!playlistResponse.ok) throw new Error('Failed to generate playlist');
      const playlistData = await playlistResponse.json();
      console.log("Playlist generated:", playlistData.playlist);
      
      // Redirect or handle the playlist data as needed
      window.location.href = "playlist.html"; // Redirect to playlist page after generation
  
    } catch (error) {
      console.error("Error submitting selections or generating playlist:", error);
    }
  }
  
  function addSubmitButton() {
    const container = document.querySelector('.submit-container');
    if (!container) return;

    let submitButton = document.getElementById("submit-button");
    if (!submitButton) {
      submitButton = document.createElement("button");
      submitButton.id = "submit-button";
      submitButton.innerText = "Submit";
      submitButton.addEventListener("click", submitSelections);
      container.appendChild(submitButton);
    }
  }
  
  fetchGenres();
  fetchSubGenres();
  addSubmitButton();
});

