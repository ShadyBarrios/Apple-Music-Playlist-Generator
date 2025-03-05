import { storeUserBackend, getUserBackend } from "./indexedDB.js";

document.addEventListener("DOMContentLoaded", async () => {
  let userToken = ""; // Will be pulled with MusicKit

  // Add clear IndexedDB functionality
  const clearDbButton = document.getElementById('clear-db');
  if (clearDbButton) {
    clearDbButton.addEventListener('click', async () => {
      await clearUserData();
      alert('IndexedDB data cleared. You can now try logging in again.');
    });
  }

  async function clearUserData() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("userDatabase");
      
      request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction("userBackend", "readwrite");
        const store = transaction.objectStore("userBackend");
        
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = function() {
          console.log("User data cleared from IndexedDB");
          resolve();
        };
        
        clearRequest.onerror = function() {
          console.error("Error clearing user data:", clearRequest.error);
          reject(clearRequest.error);
        };
      };
      
      request.onerror = function() {
        console.error("Error opening database:", request.error);
        reject(request.error);
      };
    });
  }

  async function get_dev_token() {
    try {
      console.log("Fetching developer token...");
      const response = await fetch('/get-dev-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to get developer token');
      const data = await response.json();
      console.log("Developer token received");
      return data.data;
    } catch (error) {
      console.error('Error getting developer token:', error);
    }
  }

  function update_loading_status(status) {
    const statusElement = document.getElementById("loading_status");
    const loadingAnimate = document.getElementById("loading_animate");
    const loginButton = document.getElementById("login");
    const loginHeading = document.querySelector(".login h1");
    
    if (statusElement) statusElement.innerText = status;
    if (loadingAnimate) loadingAnimate.style.display = status === "Loading..." ? "block" : "none";
    if (loginButton) loginButton.style.display = status === "Loading..." ? "none" : "block";
    if (loginHeading) loginHeading.style.display = status === "Loading..." ? "none" : "block";
  }

  const loginButton = document.getElementById("login");

  if (loginButton) {
    console.log("Login button found, adding click event listener");
    loginButton.addEventListener("click", async () => {
      console.log("Login button clicked");
      update_loading_status("Loading...");
      const developer_token = await get_dev_token();
      console.log("Developer token:", developer_token ? "Received" : "Not received");

      try {
        console.log("Configuring MusicKit...");
        const music = await MusicKit.configure({
          developerToken: developer_token,
          app: { name: "Custom Playlist Generator", build: "1.0.0" },
        });
        console.log("MusicKit configured");

        console.log("Authorizing with Apple Music...");
        await music.authorize();
        console.log("Authorization successful");
        userToken = music.musicUserToken;

        if (userToken) {
          console.log("User Token:", userToken);
          console.log("Sending token to server...");
          const response = await fetch('/api-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: userToken }),
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log("API Login Response:", responseData);
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
