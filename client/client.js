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
  const loadingStatus = document.getElementById("loading_status");
  const loadingAnimate = document.getElementById("loading_animate");

  loadingStatus.innerText = status;

  if (status === "Loaded") {
    document.getElementById("get_numbers").style.display = "block";
    fetchGenres();
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

// Event Listeners - wrapped in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', function() {
    // Show loading animation by default
    const loadingAnimate = document.getElementById("loading_animate");
    if (loadingAnimate) {
        loadingAnimate.style.display = "block";
    }
    
    // Get Numbers button
    const getNumbersBtn = document.getElementById("get_numbers");
    if (getNumbersBtn) {
        getNumbersBtn.addEventListener("click", display_user_numbers);
    }

    // Start button (on index page)
    const startButton = document.getElementById("startButton");
    if (startButton) {
        startButton.addEventListener("click", function() {
            window.location.href = "/home.html";
        });
    }

    // Login button
    const loginBtn = document.getElementById("login");
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
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
                
                // Hide error message if it was previously shown
                document.getElementById("login-error").style.display = "none";
                
            } catch (error) {
                console.error("Error authorizing with Apple Music:", error);
                // Show error message
                document.getElementById("login-error").style.display = "block";
                update_loading_status(""); // Clear loading status
                console.timeEnd("login time");
            }
        });
    }

    // Go Back button
    const goBackButton = document.getElementById("goBackButton");
    if (goBackButton) {
        goBackButton.addEventListener("click", function() {
            window.location.href = "/index.html";
        });
    }
});

async function fetchGenres() {
    try {
        const response = await fetch('/get-genres', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch genres');
        }

        const data = await response.json();
        console.log('Fetched Genres:', data);
        displayGenres(data.data);

    } catch (error) {
        console.error('Error fetching genres:', error);
    }
}

function displayGenres(genres) {
    const genresContainer = document.querySelector('.select-genres');  

    let buttonsContainer = document.querySelector('.genre-buttons');
    if (!buttonsContainer) {
        buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('genre-buttons');
        genresContainer.appendChild(buttonsContainer);
    }

    buttonsContainer.innerHTML = '';

    genres.forEach(genre => {
        const button = document.createElement('button');
        button.innerText = genre;
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            console.log(`Selected Genre: ${genre}`);
        });
        buttonsContainer.appendChild(button);
    });

    // Show GUFFLE button after genres are loaded
    document.getElementById('guffleButton').style.display = 'block';
}


