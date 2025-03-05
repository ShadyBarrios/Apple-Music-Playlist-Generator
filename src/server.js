import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import {UserBackend} from '../client/user.js';
import {Mutex} from 'async-mutex';
import { ParallelDataFetchers, DataFetchers, Song, GenreDictionary, SubgenreDictionary, DataSenders} from "./functions.js"

// Create .env in root folder with the following:
const isInSrc = process.cwd().endsWith('\\src');
const envPath = isInSrc ? path.resolve(process.cwd(), '../.env') : path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
const developerToken = process.env.DEVELOPER_TOKEN;

const app = express();
const port = 3000;

let userToken = "";  // get user token from frontend
let backendUser = null; // user-specific backend object

// Uncomment for windows machine
// const initialDirname = path.dirname(new URL(import.meta.url).pathname);
// let processedDirname = initialDirname.startsWith('/') ? initialDirname.slice(1) : initialDirname; // removes the leading /
// processedDirname = processedDirname.endsWith("/src") ? processedDirname.slice(0, -4) : processedDirname; // removes the /src from the end
// const __dirname = decodeURIComponent(processedDirname); // decodes the URI encoding

// Uncomment for mac machine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../client'))); // find client directory from root
app.use(express.json());

// endpoint to handle the login API (using the developerToken from .env file)
app.post('/api-login', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'User Token fetch failed' });
  }

  userToken = token;  // store the token only once
  console.log('SERVER.JS: Using developer token from .env: ', developerToken);
  console.log('SERVER.JS: Received new user token: ', userToken);

  backendUser = await backend.createUser(userToken);
  //console.log("backend User: " + backendUser);

  res.json({ message: 'User Token fetch successful', backendUser });
});

app.post('/get-genres', (req, res) => {
  console.log("Genres endpoint hit!");

  if (!backendUser || !backendUser.genre_dictionary || !backendUser.genre_dictionary._dictionary) {
    console.error("Error: genre dictionary is undefined.");
    return res.status(500).json({ error: "Genre dictionary not found on the server." });
  }

  console.log(backendUser.genre_dictionary._dictionary);

  const allGenres = Object.keys(backendUser.genre_dictionary._dictionary);
  res.json({ data: allGenres });
});

app.post('/get-backend-object-numbers', (req, res) => {
  const obj = {
    songsLength: backendUser.songs.length,
    genresLength: Object.keys(backendUser.genre_dictionary._dictionary).length,
    subgenresLength: Object.keys(backendUser.subgenre_dictionary._dictionary).length,
  };

  res.json({ data: obj });
});

app.post('/get-subgenres', (req, res) => {
  console.log("Sub-genres endpoint hit!")
  
  if (!backendUser || !backendUser.subgenre_dictionary || !backendUser.subgenre_dictionary._dictionary) {
    return res.status(500).json({ error: "Subgenre dictionary not found on the server." });
  }

  console.log(backendUser.subgenre_dictionary._dictionary);
  const subgenres = Object.keys(backendUser.subgenre_dictionary._dictionary);
  res.json({ data: subgenres });
});


app.post('/get-dev-token', (req, res) => {
  res.json({ data: developerToken });
});


app.get('*', (req, res) => {

  //res.sendFile(path.join(__dirname, '../client', '../client/index.html'));

// (personal path issues, probably from mac machine)
  res.sendFile(path.join(__dirname, '../client/index.html')); //appending index.html only not the extra ../client
});

// Start server only if this module is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

app.post('/send-playlist', async (req, res) => {
  const { playlistName, filters } = req.body;
  if (!backendUser) {
    return res.status(400).json({ error: 'User not initialized' });
  }
  const playlist = backendUser.createPlaylist(playlistName, filters);
  if (!playlist || playlist.length === 0) {
    return res.status(500).json({ error: 'Failed to create playlist' });
  }
  // Then push to Apple Music
  try {
    await backend.pushApplePlaylist(playlist, backendUser.clientToken);
    console.log("Pushing playlist to user")
  } catch (error) {
    console.error("Error pushing playlist:", error);
    return res.status(500).json({ error: 'Failed to push playlist to Apple Music' });
  }
  res.json(playlist);
});

// will be obselete
// store the selections and playlistName globally or in a session
// let selectedGenres = [];
// let selectedSubGenres = [];
// let playlistName = "";

// app.post('/submit-selections', (req, res) => {
//   const { genres, subGenres, name } = req.body;

//   selectedGenres = genres;
//   selectedSubGenres = subGenres;
//   playlistName = name;

//   console.log("Stored Genres:", selectedGenres);
//   console.log("Stored Sub-Genres:", selectedSubGenres);
//   console.log("Stored Playlist Name:", playlistName);

//   res.json({ message: "Selections received successfully!" });
// });

// // Endpoint for generating the playlist
// app.post('/generate-playlist', async (req, res) => {
//   if (!backendUser) {
//     return res.status(400).json({ error: 'User not initialized' });
//   }

//   try {
//     const filters = [...selectedGenres, ...selectedSubGenres];

//     console.log("Generating playlist with filters:", filters);

//     // Generate the playlist using the provided name and filters
//     const playlist = backendUser.createPlaylist(playlistName, filters);
//     console.log("Playlist: ", playlist);

//     if (!playlist || playlist.length === 0) {
//       return res.status(500).json({ error: 'Failed to generate playlist or no songs found' });
//     }
//     res.json({ playlist });
//   } catch (error) {
//     console.error("Error generating playlist:", error);
//     res.status(500).json({ error: 'Server error while generating playlist' });
//   }
// });

// Export the app for testing
export default app;

// backend object 
export class Backend {
  /**
   * Constructor
   * @param {UserBackend[]} clientUsers 
   * @param {string[]} appleTokens
   * @param {Mutex} backendMutex
   * @param {string} dev 
   * @returns {Backend} backend object
   */

  constructor() {
      this.clientUsers = [];
      this.appleTokens = [];
      this.backendMutex = new Mutex();
      this.dev = developerToken;
  }

   /**
   * Adds new user to the backend
   * @param {string} appleToken 
   * @returns 
   */
   async createUser(appleToken) {
    let user = null;

    await this.backendMutex.runExclusive(async () => {
      // this will be the current index of the usersArray
      let clientToken = this.clientUsers.length;
      const clientExists = this.appleTokens.includes(appleToken);
      const clientIndex = this.appleTokens.indexOf(appleToken);
      console.log(clientExists);
      if(clientExists) // if client exists, find its token
        clientToken = this.clientUsers[clientIndex].clientToken;

      // get song data
      const data = await DataFetchers.get_all_user_data(this.dev, appleToken);
      const songs = data.get_songs();
    
      const genres = data.get_genre_dictionary();
      const subgenres = data.get_subgenre_dictionary();

      // make user and push to client and apple arrays
      user = new UserBackend(songs, genres, subgenres, clientToken);

      if(clientExists){
        this.clientUsers[clientIndex] = user;
      }
      else{
        this.clientUsers.push(user);
        this.appleTokens.push(appleToken);
      }
    });

    console.log("User Token: " + user.clientToken);
    console.log("User: " + user);
    
    // return token
    return user;
  }

  async pushApplePlaylist(playlist, clientToken) {
      // will get a playlist from client side and then create it in user library
      await this.backendMutex.runExclusive(() => DataSenders.create_user_playlist(playlist, this.dev, this.appleTokens[clientToken]));
  }
}

export let backend = new Backend();