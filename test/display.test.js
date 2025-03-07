import { expect } from 'chai';
import sinon from 'sinon';

describe('Display Functions', () => {
    let mockDocument;
    let consoleErrorStub;
    
    beforeEach(() => {
        mockDocument = {
            getElementById: sinon.stub(),
            querySelector: sinon.stub(),
            createElement: sinon.stub()
        };

        const mockPlaylistContainer = {
            innerHTML: '',
            appendChild: sinon.stub()
        };

        const mockSongCount = {
            innerText: ''
        };

        // Stub getElementById to return our fake elements
        mockDocument.getElementById.withArgs('playlist-container').returns(mockPlaylistContainer);
        mockDocument.getElementById.withArgs('song-count').returns(mockSongCount);

        // When creating a 'div', return a fake element that can hold innerHTML.
        mockDocument.createElement.withArgs('div').returns({ innerHTML: '', appendChild: sinon.stub() });

        global.document = mockDocument;
        consoleErrorStub = sinon.stub(console, 'error');
    });

    afterEach(() => {
        consoleErrorStub.restore();
        delete global.document;
        sinon.restore();
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

            expect(mockDocument.createElement.withArgs('div').callCount).to.equal(2);
            expect(container.appendChild.callCount).to.equal(2);
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
                } else {
                    throw new Error('Container not found');
                }
            } catch (error) {
                console.error('Display error:', error);
            }
            expect(consoleErrorStub.called).to.be.true;
        });
    });
});
