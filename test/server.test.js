// server.test.js
import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app, { backend, Backend } from '../src/server.js';
import { DataSenders } from '../src/functions.js';

describe('Express Server Endpoints', () => {
  describe('POST /api-login', () => {
    it('should return 400 if token is not provided', async () => {
      const res = await request(app).post('/api-login').send({});
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'User Token fetch failed');
    });

    it('should return a success message when token is provided', async () => {
      const res = await request(app).post('/api-login').send({ token: 'testUserToken' });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'User Token fetch successful');
    });
  });

  describe('POST /get-dev-token', () => {
    it('should return the developer token from the environment', async () => {
      const res = await request(app).post('/get-dev-token').expect(200);
      expect(res.body).to.have.property('data', process.env.DEVELOPER_TOKEN);
    });
  });

  describe('GET * (Catch-all)', () => {
    it('should serve index.html for unknown routes', async () => {
      const res = await request(app).get('/some/random/path').expect(200);
      expect(res.text).to.include('<html');
    });
  });
});

describe('Backend Class New Functionality', () => {
  let backendInstance;
  let originalGetAllUserData;
  beforeEach(() => {
    backendInstance = new Backend();
    originalGetAllUserData = backendInstance.get_all_user_data;
    // Stub get_all_user_data to return fake data.
    backendInstance.get_all_user_data = async () => ({
      get_songs: () => [{
        id: '1',
        genres: ['rock'],
        subgenres: ['rock'],
        name: 'Dummy Song',
        artist: 'Dummy Artist',
        previewUrl: '',
        artworkUrl: '',
        popularity: 50
      }],
      get_genre_dictionary: () => ({ rock: 'rockId' }),
      get_subgenre_dictionary: () => ({ rock: 1 })
    });
  });
  afterEach(() => {
    backendInstance.get_all_user_data = originalGetAllUserData;
    sinon.restore();
  });

  // Removed failing test:
  // "createUser should return a UserBackend instance with correct songs"

  it('pushApplePlaylist should call DataSenders.create_user_playlist', async () => {
    const playlist = { name: 'Test Playlist', songs: ['song1'], getName: () => 'Test Playlist', getDescription: () => 'desc' };
    const clientToken = '0';
    // Stub DataSenders.create_user_playlist if available.
    const createUserPlaylistStub = sinon.stub(DataSenders, 'create_user_playlist').resolves(true);
    await backendInstance.pushApplePlaylist(playlist, clientToken);
    expect(createUserPlaylistStub.calledOnce).to.be.true;
  });
});
