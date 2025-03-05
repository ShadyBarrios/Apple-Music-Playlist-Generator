// test/backend.test.js
import { expect } from 'chai';
import sinon from 'sinon';

// Import the classes from your file (adjust the path as needed)
import { Playlist, UserBackend } from '../src/backend.js'; 
import { Song } from '../src/functions.js';

describe('Playlist Class', () => {
  it('should create a Playlist object with valid parameters', () => {
    const songs = new Set([ new Song('1', ['rock'], ['indie']) ]);
    const name = 'My Playlist';
    const description = 'Test playlist';
    const filters = ['rock'];
    
    const playlist = new Playlist(songs, name, description, filters);
    
    expect(playlist).to.have.property('songs').that.deep.equals(songs);
    expect(playlist).to.have.property('name', name);
    expect(playlist).to.have.property('description', description);
    expect(playlist).to.have.property('filters').that.deep.equals(filters);
  });

  it('should log an error and return undefined if required parameters are missing', () => {
    const consoleErrorStub = sinon.stub(console, 'error');
    const result = new Playlist(null, 'name', 'desc', ['rock']);
    expect(consoleErrorStub.calledOnce).to.be.true;
    expect(result).to.be.undefined;
    consoleErrorStub.restore();
  });

  it('getSongs should return the songs set', () => {
    const songs = new Set([ new Song('1', ['pop'], ['dance']) ]);
    const playlist = new Playlist(songs, 'Test', 'desc', ['pop']);
    expect(playlist.getSongs()).to.deep.equal(songs);
  });
});

describe('UserBackend Class', () => {
  let consoleErrorStub;
  let consoleLogStub;

  beforeEach(() => {
    consoleErrorStub = sinon.stub(console, 'error');
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    consoleErrorStub.restore();
    consoleLogStub.restore();
    sinon.restore();
  });

  describe('UserBackend constructor', () => {
    it('should return undefined if no songs are provided', () => {
      const backend = new UserBackend(null, {}, {}, 'token');
      expect(backend.songs).to.be.undefined;
    });

    it('should create a valid UserBackend instance with proper parameters', () => {
      const songs = new Set([
        new Song('1', ['rock'], ['indie']),
        new Song('2', ['pop'], ['dance'])
      ]);
      const genreDict = { rock: 'rockId', pop: 'popId' };
      const subgenreDict = { indie: 1, dance: 1 };
      const token = 'testToken';
      
      const backend = new UserBackend(songs, genreDict, subgenreDict, token);
      
      expect(backend).to.be.an.instanceof(UserBackend);
      expect(backend.songs).to.be.an('array');
      expect(backend.genre_dictionary).to.deep.equal(genreDict);
      expect(backend.subgenre_dictionary).to.deep.equal(subgenreDict);
      expect(backend.clientToken).to.equal(token);
    });
  });

  describe('createPlaylist', () => {
    it('should add a new Playlist to generatedPlaylists when songs match the filter', () => {
      // Create dummy songs for testing
      const song1 = new Song('1', ['rock'], ['indie']);
      const song2 = new Song('2', ['pop'], ['dance']);
      const song3 = new Song('3', ['jazz'], ['smooth']);
      const songs = new Set([song1, song2, song3]);

      // Manually create a backend
      const backend = new UserBackend(songs, {}, {}, 'token');

      // Initially, there are no generated playlists.
      expect(backend.generatedPlaylists).to.have.lengthOf(0);

      // Call createPlaylist with a filter that matches song1 (rock)
      backend.createPlaylist('Rock Playlist', ['rock']);
      expect(backend.generatedPlaylists).to.have.lengthOf(1);
      
      // Verify that the playlist contains the correct song(s)
      const playlist = backend.generatedPlaylists[0];
      expect(playlist.name).to.equal('Rock Playlist');
    });

    it('should log a warning if no songs match the filter', () => {
      const song1 = new Song('1', ['rock'], ['indie']);
      const song2 = new Song('2', ['pop'], ['dance']);
      const backend = new UserBackend(new Set([song1, song2]), {}, {}, 'token');
      
      // Use a filter that doesn't match any song
      backend.createPlaylist('Non-Matching', ['jazz']);
      expect(consoleLogStub.calledWith(sinon.match(/WARNING/))).to.be.true;
      expect(backend.generatedPlaylists).to.have.lengthOf(0);
    });

    it('should log an error if createPlaylist is called with missing parameters', () => {
      const song1 = new Song('1', ['rock'], ['indie']);
      const backend = new UserBackend(new Set([song1]), {}, {}, 'token');
      
      // Missing filters parameter
      backend.createPlaylist('Incomplete Playlist', null);
      expect(consoleErrorStub.calledOnce).to.be.true;
    });
  });
});