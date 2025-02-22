// test/backendGenerator.test.js
import { expect } from 'chai';
import sinon from 'sinon';

// Import the classes from your file (adjust the path as needed)
import { Playlist, BackendGenerator } from '../src/backend.js'; 
import { SongDataFetchers, GlobalFunctions, Song, ParallelDataFetchers } from '../src/functions.js';

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

describe('BackendGenerator Class', () => {
  let stubGetAllUserSongs;
  let stubGetGenreDict;
  let stubGetSubgenreDict;
  let updateUserTokenSpy;

  beforeEach(() => {
    // Stub out asynchronous calls that fetch data from Apple API
    stubGetAllUserSongs = sinon.stub(SongDataFetchers, 'get_all_user_songs');
    // Simulate two songs with different genres/subgenres.
    stubGetAllUserSongs.resolves(
      new Set([
        new Song('1', ['rock'], ['indie']),
        new Song('2', ['pop'], ['dance'])
      ])
    );

    // Stub GlobalFunctions dictionary accessors
    stubGetGenreDict = sinon.stub(GlobalFunctions, 'get_genre_dictionary');
    stubGetGenreDict.returns({ rock: 'rockId', pop: 'popId' });

    stubGetSubgenreDict = sinon.stub(GlobalFunctions, 'get_subgenre_dictionary');
    stubGetSubgenreDict.returns({ indie: 1, dance: 1 });

    // Spy on update_user_token
    updateUserTokenSpy = sinon.spy(GlobalFunctions, 'update_user_token');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('BackendGenerator.create', () => {
    it('should return undefined if no user token is provided', async () => {
      const backend = await BackendGenerator.create(null);
      expect(backend).to.be.undefined;
    });

    it('should update the user token and return a valid BackendGenerator instance', async () => {
      const userToken = 'testToken';
      const backend = await BackendGenerator.create(userToken);
      expect(updateUserTokenSpy.calledOnceWith(userToken)).to.be.true;
      expect(backend).to.be.an.instanceof(BackendGenerator);
      expect(backend.songs).to.be.instanceof(Set);
      expect(backend.genre_dictionary).to.deep.equal({ rock: 'rockId', pop: 'popId' });
      expect(backend.subgenre_dictionary).to.deep.equal({ indie: 1, dance: 1 });
    });
  });

  describe('createPlaylist', () => {
    it('should add a new Playlist to generatedPlaylists when songs match the filter', async () => {
      // Create dummy songs for testing
      const song1 = new Song('1', ['rock'], ['indie']);
      const song2 = new Song('2', ['pop'], ['dance']);
      const song3 = new Song('3', ['jazz'], ['smooth']);
      const songsSet = new Set([song1, song2, song3]);

      // Manually create a backend (bypassing the async create call)
      const backend = new BackendGenerator(songsSet, {}, {});

      // Initially, there are no generated playlists.
      expect(backend.generatedPlaylists).to.have.lengthOf(0);

      // Call createPlaylist with a filter that matches song1 (rock)
      backend.createPlaylist('Rock Playlist', ['rock']);
      expect(backend.generatedPlaylists).to.have.lengthOf(1);
      
      // Verify that the playlist contains the correct song(s)
      const playlist = backend.generatedPlaylists[0];
      expect(playlist.name).to.equal('Rock Playlist');
      expect(playlist.getSongs().has(song1)).to.be.true;
      expect(playlist.getSongs().has(song2)).to.be.false;
      expect(playlist.getSongs().has(song3)).to.be.false;
    });

    it('should log a warning and not add a playlist if no songs match the filter', () => {
      const consoleLogStub = sinon.stub(console, 'log');
      const song1 = new Song('1', ['rock'], ['indie']);
      const song2 = new Song('2', ['pop'], ['dance']);
      const backend = new BackendGenerator(new Set([song1, song2]), {}, {});
      
      // Use a filter that doesn't match any song
      backend.createPlaylist('Non-Matching', ['jazz']);
      expect(consoleLogStub.calledWith("WARNING: No songs fit filters for: Non-Matching")).to.be.true;
      expect(backend.generatedPlaylists).to.have.lengthOf(0);
      consoleLogStub.restore();
    });

    it('should log an error and return undefined if createPlaylist is called with missing parameters', () => {
      const consoleErrorStub = sinon.stub(console, 'error');
      const song1 = new Song('1', ['rock'], ['indie']);
      const backend = new BackendGenerator(new Set([song1]), {}, {});
      
      // Missing filters parameter
      const result = backend.createPlaylist('Incomplete Playlist', null);
      expect(consoleErrorStub.calledOnce).to.be.true;
      expect(result).to.be.undefined;
      consoleErrorStub.restore();
    });
  });
  
  // Optionally, you could add tests for the debug functions.
  // Because they write to process.stdout and console, you might stub those as needed.
});