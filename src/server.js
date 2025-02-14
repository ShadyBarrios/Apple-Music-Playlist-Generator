import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { BackendGenerator } from './backend.js';

dotenv.config();

const app = express();
const port = 3000;

const developerToken = process.env.DEVELOPER_TOKEN;
let userToken = "";  // Get user token from .env file

let backend;

// Uncomment for windows machine
// const initialDirname = path.dirname(new URL(import.meta.url).pathname);
// let processedDirname = initialDirname.startsWith('/') ? initialDirname.slice(1) : initialDirname; // removes the leading /
// processedDirname = processedDirname.endsWith("/src") ? processedDirname.slice(0, -4) : processedDirname; // removes the /src from the end
// const __dirname = decodeURIComponent(processedDirname); // decodes the URI encoding

//comment for mac machine

// Comment for mac machine

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'client')));

//comment for mac machine
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

  // Serve static files from the /client directory

app.use(express.static(path.join(__dirname, '../client')));
// (personal path issues, probably from mac machine)

app.use(express.static(path.join(__dirname, '../client'))); // find client directory from root
app.use(express.json());

// Endpoint to handle the login API (using the developerToken from .env file)
app.post('/api-login', async (req, res) => {
  userToken = req.body.token;
  if (!userToken) {
    return res.status(400).json({ error: 'User Token fetch failed' });
  }

  console.log('SERVER.JS: Using developer token from .env: ', developerToken);
  console.log('SERVER.JS: Using fetched user token: ', userToken);

  backend = await BackendGenerator.create(userToken);
  console.log("Backend init");

  res.json({ message: 'User Token fetch successful' });
});

app.post('/get-genres', (req, res) => {
  console.log("Genres endpoint hit!");

  if (!backend.genre_dictionary) {
    console.error("Error: backend.genre_dictionary is undefined or null.");
    return res.status(500).json({ error: "Genre dictionary not found on the server." });
  }

  console.log(backend.genre_dictionary);
  const allGenres = Object.keys(backend.genre_dictionary);
  res.json({ data: allGenres });
});


app.post('/get-backend-object-numbers', (req, res) => {
  const obj = {
    songsLength: backend.songs.length,
    genresLength: Object.keys(backend.genre_dictionary).length,
    subgenresLength: Object.keys(backend.subgenre_dictionary).length,
  };

  res.json({ data: obj });
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
