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

  const userToken = token;  // store the token only once
  let backendUser = await backend.createUser(userToken);

  res.json({ message: 'User Token fetch successful', backendUser });
});

app.post('/api-logout', async (req, res) => {
  console.log('Logging out user');

  const { token } = req.body;

  if (token == null) {
    return res.status(400).json({ error: 'User token not provided' });
  }

  await backend.deleteUser(token);

  res.json({ message: "User logged out successfully" });
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
  const { name, description, songs, token } = req.body;
  
  if(name == null || description == null || !songs || token == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (songs.length === 0) {
    return res.status(500).json({ error: 'Failed to create playlist' });
  }
  // Then push to Apple Music
  try {
    await backend.pushApplePlaylist({name: name, description: description, songs: songs}, token);
    console.log("Pushing playlist to user")
  } catch (error) {
    console.error("Error pushing playlist:", error);
    return res.status(500).json({ error: 'Failed to push playlist to Apple Music' });
  }

  res.json({ message: "Playlist uploaded successfully" });
});

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

  async createUser(appleToken) {
    let user = null;

    await this.backendMutex.runExclusive(async () => {
      // this will be the current index of the usersArray
      let clientToken = this.clientUsers.length;
      const clientExists = this.appleTokens.includes(appleToken);
      const clientIndex = this.appleTokens.indexOf(appleToken);

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

    return user;
  }

  async deleteUser(clientToken) {
    await this.backendMutex.runExclusive(() => {
      if (this.clientUsers[clientToken] && this.clientUsers[clientToken] != null){
        this.clientUsers[clientToken] == null;
      }
      if (this.appleTokens[clientToken] && this.appleTokens[clientToken] != null){
        this.appleTokens[clientToken] == null;
      }
    });
  }

  async pushApplePlaylist(playlist, clientToken) {
    // will get a playlist from client side and then create it in user library
    await this.backendMutex.runExclusive(() => DataSenders.create_user_playlist(playlist, this.dev, this.appleTokens[clientToken]));
  }
}

export let backend = new Backend();