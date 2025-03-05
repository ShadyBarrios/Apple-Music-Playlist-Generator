// test/server.test.js
import request from 'supertest';
import { expect } from 'chai';
import express from 'express';

describe('Server', () => {
    let app;

    before(() => {
        app = express();
        app.use(express.json());
        
        // Basic route for testing
        app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });
    });

    describe('Health Check', () => {
        it('should return 200 OK', async () => {
            const response = await request(app).get('/health');
            expect(response.status).to.equal(200);
            expect(response.body).to.deep.equal({ status: 'ok' });
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 routes', async () => {
            const response = await request(app).get('/nonexistent');
            expect(response.status).to.equal(404);
        });
    });
});