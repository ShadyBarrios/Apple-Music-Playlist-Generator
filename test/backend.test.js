// test/backendGenerator.test.js
import { expect } from 'chai';
import sinon from 'sinon';


import { Playlist, BackendGenerator } from '../src/backend.js'; 
import { SongDataFetchers, GlobalFunctions, Song } from '../src/functions.js';

describe('Playlist Class', () => {
  it('should create a Playlist object with valid parameters', () => {
    const playlist = new Playlist('Test Playlist', ['song1', 'song2'], 'Pop');
    expect(playlist.name).to.equal('Test Playlist');
    expect(playlist.songs).to.deep.equal(['song1', 'song2']);
    expect(playlist.genre).to.equal('Pop');
  });

  it('should log an error and return undefined if required parameters are missing', () => {
    const consoleErrorStub = sinon.stub(console, 'error');
    const playlist = new Playlist();
    expect(playlist.name).to.be.undefined;
    expect(playlist.songs).to.be.undefined;
    expect(playlist.genre).to.be.undefined;
    expect(consoleErrorStub.called).to.be.true;
    consoleErrorStub.restore();
  });

  it('getSongs should return the songs set', () => {
    const songs = ['song1', 'song2'];
    const playlist = new Playlist('Test Playlist', songs, 'Pop');
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
});

describe('Backend Generator', () => {
    let mockSongs;
    let mockGenreDictionary;
    let mockSubgenreDictionary;

    beforeEach(() => {
        mockSongs = new Set([
            new Song('1', ['pop'], ['modern pop']),
            new Song('2', ['rock'], ['classic rock'])
        ]);
        
        mockGenreDictionary = {
            'pop': 1,
            'rock': 2
        };
        
        mockSubgenreDictionary = {
            'modern pop': 1,
            'classic rock': 1
        };

        // Mock console
        global.console = {
            log: () => {},
            error: () => {}
        };
    });

    describe('Constructor', () => {
        it('should create a backend generator with valid inputs', () => {
            const backend = new BackendGenerator('token123', ['song1', 'song2'], ['Pop'], ['Rock']);
            expect(backend.userToken).to.equal('token123');
            expect(backend.songIDs).to.deep.equal(['song1', 'song2']);
            expect(backend.genres).to.deep.equal(['Pop']);
            expect(backend.subgenres).to.deep.equal(['Rock']);
        });

        it('should handle missing parameters', () => {
            const consoleErrorStub = sinon.stub(console, 'error');
            const backend = new BackendGenerator();
            expect(backend.userToken).to.be.undefined;
            expect(backend.songIDs).to.be.undefined;
            expect(backend.genres).to.be.undefined;
            expect(backend.subgenres).to.be.undefined;
            expect(consoleErrorStub.called).to.be.true;
            consoleErrorStub.restore();
        });
    });

    describe('Playlist Creation', () => {
        it('should create playlist with valid parameters', () => {
            const backend = new BackendGenerator('token123', ['song1', 'song2'], ['Pop'], ['Rock']);
            const playlist = backend.createPlaylist('Test Playlist', ['song1'], 'Pop');
            expect(playlist.name).to.equal('Test Playlist');
            expect(playlist.songs).to.deep.equal(['song1']);
            expect(playlist.genre).to.equal('Pop');
        });

        it('should handle missing playlist parameters', () => {
            const backend = new BackendGenerator('token123', ['song1', 'song2'], ['Pop'], ['Rock']);
            const consoleErrorStub = sinon.stub(console, 'error');
            const playlist = backend.createPlaylist();
            expect(playlist).to.be.undefined;
            expect(consoleErrorStub.called).to.be.true;
            consoleErrorStub.restore();
        });
    });

    describe('Genre Management', () => {
        it('should handle genre filtering', () => {
            const backend = new BackendGenerator('token123', ['song1', 'song2'], ['Pop', 'Rock'], ['Alt Rock']);
            expect(backend.genres).to.deep.equal(['Pop', 'Rock']);
        });

        it('should handle subgenre filtering', () => {
            const backend = new BackendGenerator('token123', ['song1', 'song2'], ['Pop'], ['Rock', 'Alt Rock']);
            expect(backend.subgenres).to.deep.equal(['Rock', 'Alt Rock']);
        });
    });
});