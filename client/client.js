// Function to handle the login API call

let userToken = "" //will be pulled with musicKit
async function login_user() {
  try {
    const response = await fetch('/api-login', {  // POST to /api-login
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
    fetchGenres();
    fetchSubGenres();
  } else {
    document.getElementById("get_numbers").style.display = "none";
  }
}
function update_numbers(data){
  document.getElementById("numbers").innerText = data;
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

document.getElementById("get_numbers").addEventListener("click", async () => {
  await display_user_numbers();
});

// get user token and send to backend
document.getElementById("login").addEventListener("click", async () => {

  if (userToken) {
    console.log("User already logged in with token:", userToken);
    update_loading_status("Loaded");
    return;
  }

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

      await music.authorize();

      // retrieve the user token
      //const userToken = process.env.USER_TOKEN; // for testing reasons
      
      userToken = music.musicUserToken; // to dynamically get user token

      if (userToken) {
        console.log("User Token: ", userToken);

        await fetch('/api-login', { //send userToken
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: userToken }),
        });

        update_loading_status("Loaded");
      }

      else {
        console.error("Failed to send user token."); 
      }
      console.timeEnd("login time");
  } catch (error) {
      console.error("Error authorizing with Apple Music:", error);
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

    const data = await response.json(); // Parse the JSON response
    console.log('Fetched Genres:', data);  // Check if genres are received
    displayGenres(data.data);

  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}
async function fetchSubGenres() {
  try {
    const response = await fetch('/get-subgenres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sub-genres');
    }

    const data = await response.json();
    console.log(`Fetched Sub-Genres:`, data);
    displaySubGenres(data.data);
  } catch (error) {
    console.error('Error fetching sub-genres:', error);
  }
}

function displayGenres(genres) {
  const genresContainer = document.querySelector('.genre-buttons');

  let wrapper = document.querySelector('.genre-buttons-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.classList.add('genre-buttons-wrapper');
    genresContainer.appendChild(wrapper);
  }

  wrapper.innerHTML = ''; // Clear previous buttons

  genres.forEach(genre => {
    const button = document.createElement('button');
    button.innerText = genre;
    button.addEventListener('click', () => {
      console.log(`Selected Genre: ${genre}`);
    });
    wrapper.appendChild(button);
  });
}

function displaySubGenres(subGenres) {
  const subGenresContainer = document.querySelector('.subgenre-buttons');

  let wrapper = document.querySelector('.subgenre-buttons-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.classList.add('subgenre-buttons-wrapper');
    subGenresContainer.appendChild(wrapper);
  }

  wrapper.innerHTML = ''; // Clear previous buttons

  subGenres.forEach(subGenre => {
    const button = document.createElement('button');
    button.innerText = subGenre;
    button.addEventListener('click', () => {
      console.log(`Selected Sub-Genre: ${subGenre}`);
    });
    wrapper.appendChild(button);
  });
}
