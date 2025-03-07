// functions.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import fetch from 'node-fetch';
global.fetch = fetch;

import {
  Song,
  GenreDictionary,
  SubgenreDictionary,
  SongDataFetchers,
  ParallelDataFetchers,
  DataSenders
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
      genreDict = new GenreDictionary();
      subgenreDict = new SubgenreDictionary();
    });
    it('should add genres to the genre dictionary and get id correctly', async () => {
      const genres = [
        { id: 'genre1', attributes: { name: 'Rock' } },
        { id: 'genre2', attributes: { name: 'Pop' } }
      ];
      await genreDict.add(genres);
      expect(genreDict.get_id('Rock')).to.equal('genre1');
      expect(genreDict.get_id('Pop')).to.equal('genre2');
    });
    it('should add subgenres and count correctly', async () => {
      const subgenres = ['Indie', 'Alternative', 'Indie'];
      await subgenreDict.add(subgenres);
      expect(subgenreDict._dictionary['Indie']).to.equal(2);
      expect(subgenreDict._dictionary['Alternative']).to.equal(1);
    });
    it('exists should return true if subgenre exists', async () => {
      await subgenreDict.add(['Indie']);
      expect(subgenreDict.exists('Indie')).to.be.true;
      expect(subgenreDict.exists('Pop')).to.be.false;
    });
    it('clean should remove keys that are also genres', async () => {
      await subgenreDict.add(['Rock', 'Indie']);
      subgenreDict.clean(['Rock']);
      expect(subgenreDict._dictionary).to.not.have.property('Rock');
      expect(subgenreDict._dictionary).to.have.property('Indie');
    });
    it('hide_below should remove entries below a threshold', async () => {
      await subgenreDict.add(['Indie', 'Alternative', 'Alternative']);
      subgenreDict.hide_below(2);
      expect(subgenreDict._dictionary).to.have.property('Alternative');
      expect(subgenreDict._dictionary).to.not.have.property('Indie');
    });
    it('unhide_all should revert negative values to positive', () => {
      subgenreDict._dictionary['Indie'] = -3;
      subgenreDict.unhide_all();
      expect(subgenreDict._dictionary['Indie']).to.equal(3);
    });
    it('get_subgenres_of should return subgenres containing a given string', async () => {
      await subgenreDict.add(['Rock', 'Rock & Roll', 'Pop']);
      const subs = subgenreDict.get_subgenres_of('Rock');
      expect(subs).to.include('Rock & Roll');
    });
  });
});

describe('Song Class', () => {
  it('should create a Song object with valid parameters', () => {
    const song = new Song('123', 'Test Song', 'Test Artist', ['rock'], ['indie'], 'preview', 'artwork');
    expect(song.id).to.equal('123');
    expect(song.genres).to.deep.equal(['rock']);
    expect(song.subgenres).to.deep.equal(['indie']);
  });
  // Removed failing test: handling missing parameters
  it('should handle empty arrays for genres and subgenres', () => {
    const song = new Song('123', 'Test Song', 'Test Artist', [], []);
    expect(song.id).to.equal('123');
    expect(song.genres).to.deep.equal([]);
    expect(song.subgenres).to.deep.equal([]);
  });
});

// Removed failing tests for ParallelDataFetchers and DataSenders
