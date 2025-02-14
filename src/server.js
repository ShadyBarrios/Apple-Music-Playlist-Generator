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

// Comment for mac machine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'client')));
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
  res.sendFile(path.join(__dirname, '../client', '../client/index.html'));
});

// Start server only if this module is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

// Export the app for testing
export default app;
