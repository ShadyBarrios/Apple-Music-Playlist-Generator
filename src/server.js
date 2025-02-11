import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

const developerToken = process.env.DEVELOPER_TOKEN;
let userToken = "";  // Get user token from .env file

const initialDirname = path.dirname(new URL(import.meta.url).pathname);
let processedDirname = initialDirname.startsWith('/') ? initialDirname.slice(1) : initialDirname; // removes the leading /
processedDirname = processedDirname.endsWith("/src") ? processedDirname.slice(0, -4) : processedDirname; // removes the /src from the end
const __dirname = decodeURIComponent(processedDirname); // decodes the URI encoding

  // Serve static files from the /client directory
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());

// Endpoint to handle the login API (using the developerToken from .env file)
app.post('/api-login', (req, res) => {
  userToken = req.body.token;
  if (!userToken) {
    return res.status(400).json({ error: 'User token is required' });
  }

  console.log('SERVER.JS: Using developer token from .env: ', developerToken);  // Process token (you can store/validate it)
  console.log();
  console.log('SERVER.JS: Using fetched user token: ', userToken);  // Process token (you can store/validate it)

  res.json({ message: 'User token fetch successful' });
});

app.post('/get-dev-token', (req, res) => {
  res.json({ developerToken: developerToken });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
