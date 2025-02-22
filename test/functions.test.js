// test/functions.test.js
import { expect } from 'chai';
import sinon from 'sinon';

// Import the functions/classes you want to test from your functions.js file
import {
  GlobalFunctions,
  Song,
  GenreDataFetchers,
  Recommender
} from '../src/functions.js';

describe('GlobalFunctions', () => {
  describe('round_up', () => {
    it('should return the same number if whole', () => {
      expect(GlobalFunctions.round_up(5)).to.equal(5);
    });

    it('should round up a non-integer to the next whole number', () => {
      expect(GlobalFunctions.round_up(3.2)).to.equal(4);
      expect(GlobalFunctions.round_up(7.9)).to.equal(8);
    });
  });

  describe('songIDs_partitioner', () => {
    it('should partition an array of song IDs into chunks of 300', () => {
      const songIDs = Array.from({ length: 650 }, (_, i) => `song${i + 1}`);
      const partitions = GlobalFunctions.songIDs_partitioner(songIDs);

      expect(partitions).to.be.an('array');
      expect(partitions.length).to.equal(3);
      expect(partitions[0].length).to.equal(300);
      expect(partitions[1].length).to.equal(300);
      expect(partitions[2].length).to.equal(50);
    });
  });

  describe('update_user_token and get_headers', () => {
    it('should update the user token and return correct headers', () => {
      // Update the token
      GlobalFunctions.update_user_token('myTestToken');
      const headers = GlobalFunctions.get_headers();
      expect(headers).to.have.property('Music-User-Token', 'myTestToken');
      // developerToken comes from .env so we assume it’s already set
      expect(headers.Authorization).to.be.a('string');
    });
  });
});

describe('fetchData and GenreDataFetchers', () => {
  let fetchStub;
  const fakeUrl = 'https://example.com';

  beforeEach(() => {
    // Stub the global fetch function
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    // Restore the original fetch after each test
    fetchStub.restore();
  });

  it('GlobalFunctions.fetchData should call fetch with proper headers', async () => {
    // Arrange: fake a successful response
    const fakeResponse = {
      ok: true,
      json: async () => ({ data: 'test' })
    };
    fetchStub.resolves(fakeResponse);

    // Act
    const response = await GlobalFunctions.fetchData(fakeUrl);

    // Assert
    expect(fetchStub.calledOnce).to.be.true;
    expect(response).to.deep.equal(fakeResponse);
  });

  it('GenreDataFetchers.get_genres should return genre data when response is ok', async () => {
    // Arrange: set up a fake API response for genres
    const fakeGenreData = {
      ok: true,
      json: async () => ({
        data: [{
          relationships: {
            genres: {
              data: [
                { id: '123', attributes: { name: 'Pop' } }
              ]
            }
          }
        }]
      })
    };
    fetchStub.resolves(fakeGenreData);

    // Act
    const genres = await GenreDataFetchers.get_genres('song123');

    // Assert
    expect(genres).to.be.an('array');
    expect(genres[0]).to.have.property('id', '123');
    expect(fetchStub.calledOnce).to.be.true;
  });

  it('GenreDataFetchers.get_genres should log an error and return undefined on HTTP error', async () => {
    // Arrange: simulate a response that is not OK (e.g. 403)
    const fakeErrorResponse = {
      ok: false,
      status: 403
    };
    fetchStub.resolves(fakeErrorResponse);

    // Act
    const genres = await GenreDataFetchers.get_genres('song123');

    // Assert: in our code we catch the error and log it, then return undefined
    expect(genres).to.be.undefined;
  });
});

describe('Recommender', () => {
  let fetchStub;
  beforeEach(async () => {
    // Stub fetch for recommender tests
    fetchStub = sinon.stub(global, 'fetch');

    // Set up the genre dictionary by adding a genre.
    // This is needed because Recommender.get_genre_song_recommendation looks up the genre ID directly.
    await GlobalFunctions.add_to_genre_dictionary([{ id: '456', attributes: { name: 'Rock' } }]);
  });
  afterEach(() => {
    fetchStub.restore();
  });

  it('should return a song recommendation for a valid genre', async () => {
    // Arrange: fake a successful response for charts
    const fakeResponse = {
      ok: true,
      json: async () => ({
        results: {
          songs: [{
            data: [
              { id: 'song1', attributes: { name: 'Test Song', artistName: 'Test Artist', genreNames: ['Rock'] } },
              { id: 'song2', attributes: { name: 'Another Song', artistName: 'Another Artist', genreNames: ['Rock'] } }
            ]
          }]
        }
      })
    };
    fetchStub.resolves(fakeResponse);

    // Act
    const song = await Recommender.get_genre_song_recommendation('Rock');

    // Assert
    expect(song).to.be.an('object');
    expect(song).to.have.property('id');
  });

  it('should return undefined and log an error if the genre is not in the dictionary', async () => {
    // Act: request recommendation for a genre not present in the dictionary
    const song = await Recommender.get_genre_song_recommendation('NonExistentGenre');
    // Since the genre is not in the dictionary, an error is logged and undefined is returned.
    expect(song).to.be.undefined;
  });
});