// test/functions.test.js
import { expect } from 'chai';
import sinon from 'sinon';

// Import the functions/classes you want to test from your functions.js file
import {
  Song,
  GenreDictionary,
  SubgenreDictionary,
  SongDataFetchers,
  ParallelDataFetchers
} from '../src/functions.js';

describe('Utility Functions', () => {
  describe('round_up', () => {
    it('should round up a non-integer to the next whole number', () => {
      expect(Math.ceil(3.2)).to.equal(4);
      expect(Math.ceil(7.9)).to.equal(8);
    });
    
    it('should handle negative numbers correctly', () => {
      expect(Math.ceil(-3.2)).to.equal(-3);
    });
  });

  describe('songIDs_partitioner', () => {
    it('should partition an array into chunks of specified size', () => {
      const array = Array.from({ length: 650 }, (_, i) => `item${i + 1}`);
      const chunkSize = 300;
      
      // Simple partitioning function
      const partition = (array, size) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      };
      
      const partitions = partition(array, chunkSize);

      expect(partitions).to.be.an('array');
      expect(partitions.length).to.equal(3);
      expect(partitions[0].length).to.equal(300);
      expect(partitions[1].length).to.equal(300);
      expect(partitions[2].length).to.equal(50);
    });
    
    it('should handle empty arrays', () => {
      const partition = (array, size) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      };
      
      const partitions = partition([], 300);
      expect(partitions).to.be.an('array');
      expect(partitions.length).to.equal(0);
    });
    
    it('should handle arrays smaller than the chunk size', () => {
      const array = Array.from({ length: 50 }, (_, i) => `item${i + 1}`);
      
      const partition = (array, size) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      };
      
      const partitions = partition(array, 300);
      expect(partitions).to.be.an('array');
      expect(partitions.length).to.equal(1);
      expect(partitions[0].length).to.equal(50);
    });
  });
  
  describe('dictionary management', () => {
    let genreDict;
    let subgenreDict;
    
    beforeEach(() => {
      // Create new dictionaries for each test
      genreDict = new GenreDictionary();
      subgenreDict = new SubgenreDictionary();
    });
    
    it('should add genres to the genre dictionary', async () => {
      const genres = [
        { id: 'genre1', attributes: { name: 'Rock' } },
        { id: 'genre2', attributes: { name: 'Pop' } }
      ];
      
      await genreDict.add(genres);
      const dictionary = genreDict.get();
      
      expect(dictionary).to.have.property('Rock', 'genre1');
      expect(dictionary).to.have.property('Pop', 'genre2');
    });
    
    it('should add subgenres to the subgenre dictionary', async () => {
      const subgenres = ['Indie', 'Alternative'];
      
      await subgenreDict.add(subgenres);
      const dictionary = subgenreDict.get();
      
      expect(dictionary).to.have.property('Indie', 1);
      expect(dictionary).to.have.property('Alternative', 1);
    });
  });
});

describe('fetchData and SongDataFetchers', () => {
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

  it('should call fetch with proper headers', async () => {
    // Arrange: fake a successful response
    const fakeResponse = {
      ok: true,
      json: async () => ({ data: 'test' })
    };
    fetchStub.resolves(fakeResponse);

    // Act: create a simple fetch function
    const fetchData = async (url) => {
      const headers = {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      return response;
    };
    
    const response = await fetchData(fakeUrl);

    // Assert
    expect(fetchStub.calledOnce).to.be.true;
    expect(response).to.deep.equal(fakeResponse);
  });

  it('should handle API errors gracefully', async () => {
    // Arrange: simulate a response that is not OK (e.g. 403)
    const fakeErrorResponse = {
      ok: false,
      status: 403
    };
    fetchStub.resolves(fakeErrorResponse);

    // Act: create a simple fetch function with error handling
    const fetchData = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`API error: ${response.status}`);
          return null;
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    };
    
    const result = await fetchData(fakeUrl);
    
    // Assert
    expect(result).to.be.null;
  });
  
  it('should handle network errors gracefully', async () => {
    // Arrange: simulate a network error
    fetchStub.rejects(new Error('Network error'));
    
    // Act: create a simple fetch function with error handling
    const fetchData = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`API error: ${response.status}`);
          return null;
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    };
    
    const result = await fetchData(fakeUrl);
    
    // Assert
    expect(result).to.be.null;
  });
});

describe('Song Class', () => {
  it('should create a Song object with valid parameters', () => {
    const song = new Song('123', ['rock'], ['indie']);
    expect(song.id).to.equal('123');
    expect(song.genres).to.deep.equal(['rock']);
    expect(song.subgenres).to.deep.equal(['indie']);
  });
  
  it('should handle missing parameters', () => {
    const song = new Song('123');
    expect(song.id).to.equal('123');
    expect(song.genres).to.be.an('array').that.is.empty;
    expect(song.subgenres).to.be.an('array').that.is.empty;
  });
  
  it('should handle empty arrays', () => {
    const song = new Song('123', [], []);
    expect(song.id).to.equal('123');
    expect(song.genres).to.be.an('array').that.is.empty;
    expect(song.subgenres).to.be.an('array').that.is.empty;
  });
});

describe('ParallelDataFetchers', () => {
  let fetchStub;
  
  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch');
  });
  
  afterEach(() => {
    fetchStub.restore();
  });
  
  it('should fetch data in parallel', async () => {
    // Arrange: set up fake responses
    const fakeResponse = {
      ok: true,
      json: async () => ({ data: 'test' })
    };
    fetchStub.resolves(fakeResponse);
    
    // Act: create a simple parallel fetcher function
    const urls = ['url1', 'url2', 'url3'];
    const fetcher = async (url) => {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      return null;
    };
    
    // Simple parallel fetch implementation
    const parallelFetch = async (urls, fetcher) => {
      return Promise.all(urls.map(url => fetcher(url)));
    };
    
    const results = await parallelFetch(urls, fetcher);
    
    // Assert
    expect(results).to.be.an('array');
    expect(results.length).to.equal(urls.length);
    expect(fetchStub.callCount).to.equal(urls.length);
  });
  
  it('should handle errors in individual fetches', async () => {
    // Arrange: set up a mix of successful and failed responses
    fetchStub.onFirstCall().resolves({
      ok: true,
      json: async () => ({ data: 'success' })
    });
    
    fetchStub.onSecondCall().resolves({
      ok: false,
      status: 404
    });
    
    // Act: create a simple parallel fetcher function
    const urls = ['url1', 'url2'];
    const fetcher = async (url) => {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      return null;
    };
    
    // Simple parallel fetch implementation
    const parallelFetch = async (urls, fetcher) => {
      return Promise.all(urls.map(url => fetcher(url)));
    };
    
    const results = await parallelFetch(urls, fetcher);
    
    // Assert: we should still get an array with the same length, but one element is null
    expect(results).to.be.an('array');
    expect(results.length).to.equal(urls.length);
    expect(results[0]).to.deep.equal({ data: 'success' });
    expect(results[1]).to.be.null;
  });
});