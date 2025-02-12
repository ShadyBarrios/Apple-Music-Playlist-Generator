import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import {BackendGenerator} from './backend.js';

dotenv.config();

const app = express();
const port = 3000;

const developerToken = process.env.DEVELOPER_TOKEN;
let userToken = "";  // Get user token from .env file

let backend;

//uncomment for windows machine
// const initialDirname = path.dirname(new URL(import.meta.url).pathname);
// let processedDirname = initialDirname.startsWith('/') ? initialDirname.slice(1) : initialDirname; // removes the leading /
// processedDirname = processedDirname.endsWith("/src") ? processedDirname.slice(0, -4) : processedDirname; // removes the /src from the end
// const __dirname = decodeURIComponent(processedDirname); // decodes the URI encoding


//comment for mac machine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//call client directory
app.use(express.static(path.join(__dirname, 'client')));

//comment for mac machine
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

  // Serve static files from the /client directory
app.use(express.static(path.join(__dirname, '../client')));
// (personal path issues, probably from mac machine)
app.use(express.json());

// Endpoint to handle the login API (using the developerToken from .env file)
app.post('/api-login', async (req, res) => {
  userToken = req.body.token;
  if (!userToken) {
    return res.status(400).json({ error: 'User Token fetch failed' });
  }

  console.log('SERVER.JS: Using developer token from .env: ', developerToken);  // Process token (you can store/validate it)
  console.log();
  console.log('SERVER.JS: Using fetched user token: ', userToken);  // Process token (you can store/validate it)

  backend = await BackendGenerator.create(userToken);
  console.log("Backend init");

  res.json({ message: 'User Token fetch successful' });
});

app.post('/get-backend-object-numbers', (req, res) => {
  const obj = {
    songsLength: backend.songs.length,
    genresLength: Object.keys(backend.genre_dictionary).length,
    subgenresLength: Object.keys(backend.subgenre_dictionary).length,
  };

  res.json({ data: obj });
})

app.post('/get-dev-token', (req, res) => {
  res.json({ data: developerToken });
});

app.get('*', (req, res) => {

  //res.sendFile(path.join(__dirname, '../client', '../client/index.html'));

  res.sendFile(path.join(__dirname, '../client/index.html'));
// (personal path issues, probably from mac machine)
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
