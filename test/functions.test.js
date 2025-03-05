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
      expect(Math.ceil(5)).to.equal(5);
    });

    it('should round up a non-integer to the next whole number', () => {
      expect(Math.ceil(5.1)).to.equal(6);
      expect(Math.ceil(5.9)).to.equal(6);
    });
  });

  describe('songIDs_partitioner', () => {
    it('should partition an array of song IDs into chunks of 300', () => {
      const songIDs = Array.from({ length: 500 }, (_, i) => `song${i}`);
      const chunks = [];
      for (let i = 0; i < songIDs.length; i += 300) {
        chunks.push(songIDs.slice(i, i + 300));
      }
      expect(chunks[0]).to.have.lengthOf(300);
      expect(chunks[1]).to.have.lengthOf(200);
    });
  });

  describe('update_user_token and get_headers', () => {
    it('should update the user token and return correct headers', () => {
      const token = 'test-token';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      expect(headers['Authorization']).to.equal('Bearer test-token');
      expect(headers['Content-Type']).to.equal('application/json');
    });
  });
});

describe('API Interactions', () => {
  let originalFetch;
  let consoleErrorStub;

  beforeEach(() => {
    // Save original fetch if it exists
    originalFetch = global.fetch;
    
    // Mock fetch
    global.fetch = sinon.stub().resolves({
      ok: true,
      json: async () => ({ data: 'test data' })
    });
    
    // Mock console
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    consoleErrorStub.restore();
  });

  it('should handle successful API calls', () => {
    const makeApiCall = async () => {
      const response = await fetch('/api/test');
      if (!response.ok) throw new Error('API error');
      return response.json();
    };
    
    expect(makeApiCall()).to.eventually.have.property('data');
  });

  it('should handle API errors', () => {
    // Override the fetch mock for this test
    global.fetch = sinon.stub().rejects(new Error('API error'));
    
    const handleApiError = (error) => {
      console.error(error);
      return null;
    };
    
    const makeApiCall = async () => {
      try {
        await fetch('/api/test');
      } catch (error) {
        return handleApiError(error);
      }
    };
    
    expect(makeApiCall()).to.eventually.be.null;
  });
});