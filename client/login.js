import { storeUserBackend, getUserBackend } from "./indexedDB.js";

document.addEventListener("DOMContentLoaded", async () => {
  let userToken = ""; // Will be pulled with MusicKit
  
  async function get_dev_token() {
    try {
      const response = await fetch('/get-dev-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to get developer token');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting developer token:', error);
    }
  }

  function update_loading_status(status) {
    const statusElement = document.getElementById("loading_status");
    const loadingAnimate = document.getElementById("loading_animate");
    const loginButton = document.getElementById("login");
    const loginHeading = document.querySelector(".login-container h1");
    const featuresSection = document.querySelector(".features-section");
    const welcomeText = document.querySelector(".login-container p:not(#loading_status)");
    const loadingContainer = document.querySelector(".loading-container");
    
    if (statusElement) statusElement.innerText = status;
    
    // Show/hide loading animation
    if (loadingAnimate) {
      loadingAnimate.style.display = status === "Loading..." ? "block" : "none";
    }
    
    if (loginButton) {
      loginButton.style.display = status === "Loading..." ? "none" : "block";
    }
    
    // Show/hide loading container
    if (loadingContainer) {
      loadingContainer.style.display = status === "Loading..." ? "flex" : "none";
    }
    
    // Hide/show additional elements during loading
    if (loginHeading) {
      loginHeading.style.display = status === "Loading..." ? "none" : "block";
    }
    
    if (featuresSection) {
      featuresSection.style.display = status === "Loading..." ? "none" : "flex";
    }
    
    if (welcomeText) {
      welcomeText.style.display = status === "Loading..." ? "none" : "block";
    }
  }

  const loginButton = document.getElementById("login");

  if (loginButton) {
    loginButton.addEventListener("click", async () => {
      update_loading_status("Loading...");
      const developer_token = await get_dev_token();

      try {
        const music = await MusicKit.configure({
          developerToken: developer_token,
          app: { name: "Custom Playlist Generator", build: "1.0.0" },
        });

        await music.authorize();
        userToken = music.musicUserToken;

        if (userToken) {
          const response = await fetch('/api-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: userToken }),
          });

          if (response.ok) {
            const responseData = await response.json();
            await storeUserBackend(responseData); // store user backend object in IndexedDB
            update_loading_status("Loaded");
            
            setTimeout(() => {
              window.location.href = "filters.html";
            }, 500);
          } else {
            console.error("API Login failed with status:", response.status);
            update_loading_status("Login failed: " + response.status);
          }
        } else {
          console.error("Failed to login - no user token received");
          update_loading_status("Login failed: No user token received");
        }
      } catch (error) {
        console.error("Error authorizing with Apple Music:", error);
        update_loading_status("Login error: " + error.message);
      }
    });
  } else {
    console.error("Login button not found");
  }
});
