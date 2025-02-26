// Ensure the script runs only when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
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

  async function login_user() {
    try {
      const response = await fetch('/api-login', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      console.log('Login Response:', data.message);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  }

  function update_loading_status(status) {
    const statusElement = document.getElementById("loading_status");
    const loadingAnimate = document.getElementById("loading_animate");

    if (statusElement) statusElement.innerText = status;
    if (loadingAnimate) loadingAnimate.style.display = status === "Loading..." ? "block" : "none";
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
          console.log("User Token:", userToken);
          await fetch('/api-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: userToken }),
          });

          update_loading_status("Loaded");
          setTimeout(() => {
            window.location.href = "filters.html";
          }, 500);
        } else {
          console.error("Failed to send user token.");
        }
      } catch (error) {
        console.error("Error authorizing with Apple Music:", error);
      }
    });
  }
});


