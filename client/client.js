//client.js
// Function to handle the login API call
async function login_user() {
  try {
    const response = await fetch('/api-login', {  // POST to /api/login
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    console.log('Login Response:', data.message);
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

function update_loading_status(status) {

  document.getElementById("loading_status").innerText = status;
  const loadingAnimate = document.getElementById("loading_animate");

  if (status === "Loading...") {
    loadingAnimate.style.display = "block"; // Show video when loading
  } else {
    loadingAnimate.style.display = "none"; // Hide video after loading
  }

  if (status === "Loaded") {
    document.getElementById("get_numbers").style.display = "block"; // show button
  } else {
    document.getElementById("get_numbers").style.display = "none";
  }
}

function update_numbers(data){
  document.getElementById("numbers").innerText = data;
}

async function send_user_token(user_token){
  try{
    const response = await fetch('/api-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: user_token }),
    });

    const data = await response.json();

    console.log(data.message);
  }catch(error){
    console.error('Error sending user token:', error);
  }
}

async function display_user_numbers(){
  try{
    const response = await fetch('/get-backend-object-numbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      update_numbers("Failed to get backend object numbers");
      throw new Error('Failed to get backend object numbers');
    }

    const data = await response.json();

    const output = "Song Count: " + data.data.songsLength + "| Genre count: " + data.data.genresLength + " | Subgenre count: " + data.data.subgenresLength;
    update_numbers(output);
  }catch(error){
    console.error('Error getting backend object numbers:', error);
  }
}

async function get_dev_token(){
  try{
    const response = await fetch('/get-dev-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get developer token');
    }

    const data = await response.json();
    return data.data;
  }catch(error){
    console.error('Error getting developer token:', error);
  }
}

// Adding event listener to login button
// document.getElementById("login").addEventListener("click", () => {
//   login_user();  // Call the loginUser function when the login button is clicked
// });

document.getElementById("get_numbers").addEventListener("click", async () => {
  await display_user_numbers();
});

//redirect index to home
document.getElementById("startButton").addEventListener("click", function() {
  window.location.href = "/home.html"; 
});



// get user token and send to backend
document.getElementById("login").addEventListener("click", async () => {
  update_loading_status("Loading...");
  console.time("login time");
  const developer_token = await get_dev_token();

  try {
      // Initialize MusicKit with your developer token
      const music = await MusicKit.configure({
          developerToken: developer_token,
          app: {
              name: "Custom Playlist Generator",
              build: "1.0.0",
          },
      });

      // Request user authorization
      await music.authorize();

      // Retrieve the user token
      const userToken = music.musicUserToken;
      await send_user_token(userToken);
      update_loading_status("Loaded");
      console.timeEnd("login time");
  } catch (error) {
      console.error("Error authorizing with Apple Music:", error);
  }
});