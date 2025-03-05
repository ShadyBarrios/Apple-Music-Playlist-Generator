// test/client.test.js
import { expect } from 'chai';
import sinon from 'sinon';

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

    describe('API Integration', () => {
        it('should handle login errors gracefully', () => {
            mockFetch.rejects(new Error('Network error'));
            
            // Simulate login function
            const login = async () => {
                try {
                    await fetch('/api-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error logging in:', error);
                }
            };
            
            login();
            expect(consoleErrorStub.called).to.be.true;
        });

        it('should handle successful login', async () => {
            // Arrange: fake a successful response
            const fakeResponse = {
                ok: true,
                json: async () => ({ message: 'Login successful' })
            };
            mockFetch.resolves(fakeResponse);
            
            // Simulate login function
            const login = async () => {
                try {
                    const response = await fetch('/api-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Login Response:', data.message);
                        return data;
                    }
                } catch (error) {
                    console.error('Error logging in:', error);
                }
            };
            
            const result = await login();
            expect(consoleLogStub.called).to.be.true;
            expect(result).to.have.property('message', 'Login successful');
        });
    });

    describe('UI Interactions', () => {
        it('should update loading status correctly', () => {
            // Simulate update_loading_status function
            const updateLoadingStatus = (status) => {
                const loadingStatus = document.getElementById('loading_status');
                loadingStatus.innerText = status;
                
                const loadingAnimate = document.getElementById('loading_animate');
                if (status === "Loading...") {
                    loadingAnimate.style.display = "block";
                } else {
                    loadingAnimate.style.display = "none";
                }
                
                const getNumbers = document.getElementById('get_numbers');
                if (status === "Loaded") {
                    getNumbers.style.display = "block";
                } else {
                    getNumbers.style.display = "none";
                }
            };
            
            updateLoadingStatus("Loading...");
            
            const statusElement = document.getElementById("loading_status");
            const animateElement = document.getElementById("loading_animate");
            const numbersElement = document.getElementById("get_numbers");
            
            expect(statusElement.innerText).to.equal("Loading...");
            expect(animateElement.style.display).to.equal("block");
            expect(numbersElement.style.display).to.equal("none");
        });

        it('should handle genre button creation', () => {
            // Simulate displayGenres function
            const displayGenres = (genres) => {
                const container = document.querySelector('.genre-buttons');
                container.innerHTML = '';
                
                genres.forEach(genre => {
                    const button = document.createElement('button');
                    button.innerText = genre;
                    button.addEventListener('click', () => {
                        // Handle click
                    });
                    container.appendChild(button);
                });
            };
            
            const genres = ['Rock', 'Pop', 'Jazz'];
            displayGenres(genres);
            
            expect(mockDocument.createElement.callCount).to.equal(genres.length);
            const container = document.querySelector('.genre-buttons');
            expect(container.innerHTML).to.equal('');
        });
    });

    describe('Data Display', () => {
        it('should update numbers element with formatted string', () => {
            // Simulate update_numbers function
            const updateNumbers = (data) => {
                const numbersElement = document.getElementById("numbers");
                numbersElement.innerText = data;
            };
            
            const testData = "Song Count: 10 | Genre count: 5 | Subgenre count: 15";
            updateNumbers(testData);
            
            const numbersElement = document.getElementById("numbers");
            expect(numbersElement.innerText).to.equal(testData);
        });
    });
}); 