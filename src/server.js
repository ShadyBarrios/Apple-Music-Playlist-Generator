import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import {UserBackend} from './backend.js';
import {Mutex} from 'async-mutex';
import { ParallelDataFetchers, DataFetchers, Song, GenreDictionary, SubgenreDictionary, DataSenders } from "./functions.js"



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

// Endpoint to handle the login API (using the developerToken from .env file)
app.post('/api-login', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'User Token fetch failed' });
  }

  userToken = token;  // store the token only once
  console.log('SERVER.JS: Using developer token from .env: ', developerToken);
  console.log('SERVER.JS: Received new user token: ', userToken);

  backendUser = await backend.createUser(userToken);
  backend.clientUsers.push(backendUser);  // keep track of all users
  backend.appleTokens.push(userToken);   // store user token
  
  console.log("Backend initialized. Total users:", backend.clientUsers.length);


  res.json({ message: 'User Token fetch successful' });
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
  const { genre } = req.body;

  if (!backendUser || !backendUser.subgenre_dictionary || !backendUser.subgenre_dictionary._dictionary) {
    return res.status(500).json({ error: "Subgenre dictionary not found on the server." });
  }

  const subgenres = backendUser.subgenre_dictionary._dictionary[genre] || [];

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
      const clientExists = this.appleTokens.contains(appleToken);
      const clientIndex = this.appleTokens.indexOf(appleToken);
      if(clientExists) // if client exists, find its token
        clientToken = this.clientUsers[clientIndex].clientToken;

      // get song data
      const data = await this.backendMutex.runExclusive(() => DataFetchers.get_all_user_data(this.dev, appleToken));
      const songs = data.get_songs();
      const genres = data.get_genre_dictionary();
      const subgenres = data.get_subgenre_dictionary();

      // make user and push to client and apple arrays
      user = new UserBackend(songs, genres, subgenres, clientToken);

      if(!this.appleTokens.contains(appleToken)){
        this.clientUsers.push(user);
        this.appleTokens.push(appleToken);
      }
      else{
        this.clientUsers[clientIndex] = user;
      }
    });

    console.log("User Token: " + user.clientToken);
    console.log("User: " + user);
    
    // return token
    return user;
  }

  async pushApplePlaylist(playlist, clientToken) {
      // will get a playlist from client side and then create it in user library
      await this.backendMutex.runExclusive(async () => DataSenders.create_user_playlist(playlist, this.dev, this.appleTokens[clientToken]));
  }
}

export let backend = new Backend();