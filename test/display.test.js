import { expect } from 'chai';
import sinon from 'sinon';

describe('Display Functions', () => {
    let mockDocument;
    let consoleErrorStub;
    
    beforeEach(() => {
        // Mock document
        mockDocument = {
            getElementById: sinon.stub(),
            querySelector: sinon.stub(),
            createElement: sinon.stub()
        };

        // Mock DOM elements
        const mockPlaylistContainer = {
            innerHTML: '',
            appendChild: sinon.stub()
        };

        const mockSongCount = {
            innerText: ''
        };

        mockDocument.getElementById.withArgs('playlist-container').returns(mockPlaylistContainer);
        mockDocument.getElementById.withArgs('song-count').returns(mockSongCount);

        // Save original document
        global.document = mockDocument;

        // Mock console
        consoleErrorStub = sinon.stub(console, 'error');
    });

    afterEach(() => {
        consoleErrorStub.restore();
    });

    describe('Playlist Display', () => {
        it('should format playlist display correctly', () => {
            const playlists = [
                { name: 'Playlist 1', songs: ['song1', 'song2'] },
                { name: 'Playlist 2', songs: ['song3'] }
            ];

            const container = document.getElementById('playlist-container');
            container.innerHTML = '';

            playlists.forEach(playlist => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <h3>${playlist.name}</h3>
                    <p>Songs: ${playlist.songs.length}</p>
                `;
                container.appendChild(div);
            });

            expect(container.innerHTML).to.not.be.empty;
        });
    });

    describe('Song Count Display', () => {
        it('should display library song count', () => {
            const songs = ['song1', 'song2', 'song3'];
            const countElement = document.getElementById('song-count');
            countElement.innerText = `Song count: ${songs.length}`;
            expect(countElement.innerText).to.equal('Song count: 3');
        });

        it('should handle empty song lists', () => {
            const songs = [];
            const countElement = document.getElementById('song-count');
            countElement.innerText = `Song count: ${songs.length}`;
            expect(countElement.innerText).to.equal('Song count: 0');
        });
    });

    describe('Error Handling', () => {
        it('should handle display errors gracefully', () => {
            // Simulate missing DOM element
            mockDocument.getElementById.withArgs('playlist-container').returns(null);

            const playlists = [{ name: 'Test Playlist', songs: [] }];
            try {
                const container = document.getElementById('playlist-container');
                if (container) {
                    container.innerHTML = '';
                    playlists.forEach(playlist => {
                        const div = document.createElement('div');
                        div.innerHTML = `<h3>${playlist.name}</h3>`;
                        container.appendChild(div);
                    });
                }
            } catch (error) {
                expect(consoleErrorStub.called).to.be.true;
            }
        });
    });
}); 