// test/client.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import { 
    login_user,
    update_loading_status,
    update_numbers,
    send_user_token,
    display_user_numbers,
    get_dev_token,
    fetchGenres,
    displayGenres
} from '../client/client.js';

describe('Client-side Tests', () => {
    let mockDocument;
    let mockFetch;
    let consoleErrorStub;
    let consoleLogStub;

    beforeEach(() => {
        // Mock document
        mockDocument = {
            getElementById: sinon.stub(),
            querySelector: sinon.stub(),
            createElement: sinon.stub()
        };

        // Mock DOM elements
        const mockLoadingStatus = { innerText: '', style: { display: 'none' } };
        const mockLoadingAnimate = { style: { display: 'none' } };
        const mockGetNumbers = { style: { display: 'none' } };
        const mockNumbers = { innerText: '' };
        const mockGenresContainer = { 
            appendChild: sinon.stub(),
            querySelectorAll: () => [],
            innerHTML: ''
        };

        mockDocument.getElementById.withArgs('loading_status').returns(mockLoadingStatus);
        mockDocument.getElementById.withArgs('loading_animate').returns(mockLoadingAnimate);
        mockDocument.getElementById.withArgs('get_numbers').returns(mockGetNumbers);
        mockDocument.getElementById.withArgs('numbers').returns(mockNumbers);
        mockDocument.querySelector.withArgs('.select-genres').returns(mockGenresContainer);
        mockDocument.querySelector.withArgs('.genre-buttons').returns({ innerHTML: '' });

        // Mock button element
        const mockButton = {
            addEventListener: sinon.stub(),
            innerText: '',
            style: {},
            click: sinon.stub()
        };
        mockDocument.createElement.withArgs('button').returns(mockButton);

        // Set up global document
        global.document = mockDocument;
        
        // Mock fetch
        mockFetch = sinon.stub();
        global.fetch = mockFetch;
        
        // Mock console
        consoleErrorStub = sinon.stub(console, 'error');
        consoleLogStub = sinon.stub(console, 'log');
    });

    afterEach(() => {
        // Clean up
        delete global.document;
        delete global.fetch;
        consoleErrorStub.restore();
        consoleLogStub.restore();
        sinon.restore();
    });

    describe('Loading Status Updates', () => {
        it('should update loading status correctly', () => {
            update_loading_status("Loading...");
            const statusElement = document.getElementById("loading_status");
            expect(statusElement.innerText).to.equal("Loading...");
        });

        it('should show/hide elements based on loaded state', () => {
            update_loading_status("Loaded");
            
            const animate = document.getElementById("loading_animate");
            const numbers = document.getElementById("get_numbers");
            
            expect(animate.style.display).to.equal("none");
            expect(numbers.style.display).to.equal("block");
        });
    });

    describe('API Integration', () => {
        it('should handle login errors gracefully', () => {
            mockFetch.rejects(new Error('Network error'));
            
            login_user();
            expect(consoleErrorStub.called).to.be.true;
        });

        it('should handle numbers display errors', () => {
            mockFetch.rejects(new Error('Backend error'));
            
            display_user_numbers();
            expect(consoleErrorStub.called).to.be.true;
        });

        it('should handle developer token errors', () => {
            mockFetch.rejects(new Error('Token error'));
            
            get_dev_token();
            expect(consoleErrorStub.called).to.be.true;
        });
    });

    describe('Genre Management', () => {
        it('should create genre buttons', () => {
            const genres = ['Rock', 'Pop', 'Jazz'];
            displayGenres(genres);
            expect(mockDocument.createElement.callCount).to.equal(genres.length);
        });

        it('should clear existing genre buttons before adding new ones', () => {
            const genreContainer = document.querySelector('.genre-buttons');
            displayGenres(['Rock']);
            expect(genreContainer.innerHTML).to.equal('');
        });

        it('should add click event listeners to genre buttons', () => {
            const mockButton = mockDocument.createElement('button');
            displayGenres(['Rock']);
            expect(mockButton.addEventListener.called).to.be.true;
            expect(mockButton.addEventListener.firstCall.args[0]).to.equal('click');
        });
    });

    describe('Backend Numbers Display', () => {
        it('should update numbers element with formatted string', () => {
            const testData = "Test Numbers Data";
            update_numbers(testData);
            const numbersElement = document.getElementById("numbers");
            expect(numbersElement.innerText).to.equal(testData);
        });
    });
}); 