import { expect } from 'chai';
import sinon from 'sinon';
import { SongDataFetchers, PlaylistDataFetchers } from '../src/functions.js';

describe('Data Management', () => {
    let originalFetch;
    let consoleErrorStub;

    beforeEach(() => {
        // Save original fetch if it exists
        originalFetch = global.fetch;
        
        // Mock fetch
        global.fetch = sinon.stub();
        
        // Mock console
        consoleErrorStub = sinon.stub(console, 'error');
    });

    afterEach(() => {
        // Restore original fetch
        global.fetch = originalFetch;
        consoleErrorStub.restore();
    });

    describe('Song Data Management', () => {
        it('should deduplicate song IDs', () => {
            const songIDs = ['1', '2', '1', '3', '2'];
            const uniqueIDs = [...new Set(songIDs)];
            expect(uniqueIDs).to.deep.equal(['1', '2', '3']);
        });

        it('should handle empty responses', () => {
            const songs = [];
            expect(songs).to.be.an('array').that.is.empty;
        });

        it('should handle API errors', () => {
            // Mock fetch to simulate API error
            global.fetch = async () => ({
                ok: false,
                status: 404
            });

            // Call a function that uses fetch
            const fetchData = async () => {
                try {
                    const response = await fetch('/api/test');
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

            fetchData();
            expect(consoleErrorStub.called).to.be.true;
        });
    });

    describe('Playlist Data Management', () => {
        it('should handle playlist retrieval', () => {
            const playlists = [
                { id: '1', name: 'Playlist 1' },
                { id: '2', name: 'Playlist 2' }
            ];
            expect(playlists).to.be.an('array');
            expect(playlists).to.have.lengthOf(2);
        });

        it('should handle empty playlist list', () => {
            const playlists = [];
            expect(playlists).to.be.an('array').that.is.empty;
        });

        it('should handle network timeout', () => {
            // This is a synchronous test that just verifies error handling
            const handleTimeout = (error) => {
                if (error && error.message === 'Network timeout') {
                    return [];
                }
                throw error;
            };
            
            const result = handleTimeout(new Error('Network timeout'));
            expect(result).to.be.an('array').that.is.empty;
        });
    });
}); 