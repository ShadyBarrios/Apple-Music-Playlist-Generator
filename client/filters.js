import { storeUserBackend, getUserBackend } from "./indexedDB.js";
document.addEventListener("DOMContentLoaded", () => {
  let selectedGenres = new Set();
  let selectedSubGenres = new Set();
  let userBackend = null;

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

  async function initializeUserBackend() {
    showLoading();
    try {
      userBackend = await getUserBackend();
    } catch (error) {
      console.error("Error initializing user backend:", error);
    } finally {
      hideLoading();
    }
  }
  
  function fetchGenres() {
    try {
      if (!userBackend || !userBackend.backendUser || !userBackend.backendUser.genre_dictionary) {
        throw new Error("No genres found in IndexedDB");
      }

      const genres = Object.keys(userBackend.backendUser.genre_dictionary._dictionary);
      console.log("Fetched Genres from IndexedDB:", genres);
      displayGenres(genres);
    } catch (error) {
      console.error("Error fetching genres from IndexedDB:", error);
    }
  }

  function fetchSubGenres() {
    try {
      if (!userBackend || !userBackend.backendUser || !userBackend.backendUser.subgenre_dictionary) {
        throw new Error("No sub-genres found in IndexedDB");
      }

      const subGenres = Object.keys(userBackend.backendUser.subgenre_dictionary._dictionary);
      console.log("Fetched sub-genres from IndexedDB:", subGenres);
      displaySubGenres(subGenres);
    } catch (error) {
      console.error("Error fetching sub-genres from IndexedDB:", error);
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
      listItem.classList.add("selected-filter-item");
      
      // Create filter text
      const filterText = document.createElement("span");
      filterText.innerText = genre;
      listItem.appendChild(filterText);
      
      // Create remove button (x)
      const removeButton = document.createElement("span");
      removeButton.classList.add("remove-filter");
      removeButton.innerHTML = "&times;";
      removeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedGenres.delete(genre);
        
        // Update the corresponding genre button UI
        const genreButtons = document.querySelectorAll('.genre-buttons button');
        genreButtons.forEach(button => {
          if (button.innerText === genre) {
            button.classList.remove("selected");
            button.style.backgroundColor = "#fc3c44"; // Reset color
          }
        });
        
        updateSelectedFilters();
      });
      
      listItem.appendChild(removeButton);
      selectedFiltersList.appendChild(listItem);
    });
  
    // Add selected sub-genres
    selectedSubGenres.forEach(subGenre => {
      const listItem = document.createElement("li");
      listItem.classList.add("selected-filter-item");
      
      // Create filter text
      const filterText = document.createElement("span");
      filterText.innerText = subGenre;
      listItem.appendChild(filterText);
      
      // Create remove button (x)
      const removeButton = document.createElement("span");
      removeButton.classList.add("remove-filter");
      removeButton.innerHTML = "&times;";
      removeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedSubGenres.delete(subGenre);
        
        // Update the corresponding subgenre button UI
        const subGenreButtons = document.querySelectorAll('.subgenre-buttons button');
        subGenreButtons.forEach(button => {
          if (button.innerText === subGenre) {
            button.classList.remove("selected");
            button.style.backgroundColor = "#fc3c44"; // Reset color
          }
        });
        
        updateSelectedFilters();
      });
      
      listItem.appendChild(removeButton);
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
    const selectedData = [
      ...Array.from(selectedGenres), 
      ...Array.from(selectedSubGenres)
    ];
    
  
    if (selectedData.length === 0) {
      alert("Please select at least one filter to generate a playlist.");
      return;
    }
  
    // ask user for the playlist name
    let playlistName = window.prompt("Please enter a name for your playlist:");
  
    if (!playlistName) {
      playlistName = "Guffle's Generated Playlist"; // default name
    }

    showLoading();
    console.log("Submitting selections:", selectedData, playlistName);

    try {
      const playlist = await userBackend.backendUser.createPlaylist(playlistName, selectedData);
      const playlistIndex = userBackend.backendUser.generatedPlaylists.length - 1;

      console.log("Generated Playlist: ", playlist);
      console.log("Confirmation that userbackend updated: ", userBackend);
      
      await storeUserBackend(userBackend);

      window.location.href = `playlist.html`; // redirect to playlist page after generation
    } catch (error) {
      console.error("Error creating playlist:", error);
      hideLoading();
      alert("There was an error creating your playlist. Please try again.");
    }
  }
  
  function addSubmitButton() {
    const container = document.querySelector('.submit-container');
    if (!container) return;

    let submitButton = document.getElementById("submit-button");
    if (!submitButton) {
      submitButton = document.createElement("button");
      submitButton.id = "submit-button";
      submitButton.className = "enhanced-submit-button";
      
      // Create button content with icon and text
      const buttonContent = document.createElement("span");
      buttonContent.className = "button-content";
      
      // Add icon
      const icon = document.createElement("i");
      icon.className = "fas fa-magic";
      buttonContent.appendChild(icon);
      
      // Add text
      const text = document.createTextNode(" Generate Playlist");
      buttonContent.appendChild(text);
      
      submitButton.appendChild(buttonContent);
      
      submitButton.addEventListener("click", function() {
        // Call the submit function
        submitSelections();
      });
      
      container.appendChild(submitButton);
      
      // Add CSS for the enhanced button
      const style = document.createElement('style');
      style.textContent = `
        .enhanced-submit-button {
          background: linear-gradient(135deg, #fc3c44 0%, #e73c4e 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          font-size: 18px;
          border-radius: 30px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(252, 60, 68, 0.3);
          font-weight: 600;
          outline: none;
        }
        
        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .button-content i {
          margin-right: 8px;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  (async function initialize() {
    await initializeUserBackend(); // Fetch userBackend once
    fetchGenres(); // Now use the globally initialized userBackend
    fetchSubGenres();
    addSubmitButton();
  })();
});

