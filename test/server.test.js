// test/server.test.js
import request from 'supertest';
import { expect } from 'chai';
import app from '../src/server.js';

describe('Express Server Endpoints', () => {

  describe('POST /api-login', () => {
    it('should return 400 if token is not provided', async () => {
      const res = await request(app)
        .post('/api-login')
        .send({}); // no token provided
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'User Token fetch failed');
    });

    it('should return a success message when token is provided', async () => {
      const res = await request(app)
        .post('/api-login')
        .send({ token: 'testUserToken' });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'User Token fetch successful');
    });
  });

  describe('POST /get-backend-object-numbers', () => {
    // Since this endpoint depends on /api-login being called first,
    // we call /api-login in a before hook.
    before(async () => {
      await request(app)
        .post('/api-login')
        .send({ token: 'testUserToken' })
        .expect(200);
    });

    it('should return an object with backend numbers', async () => {
      const res = await request(app)
        .post('/get-backend-object-numbers')
        .expect(200);
      
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('songsLength');
      expect(res.body.data).to.have.property('genresLength');
      expect(res.body.data).to.have.property('subgenresLength');
    });
  });

  describe('POST /get-dev-token', () => {
    it('should return the developer token from the environment', async () => {
      const res = await request(app)
        .post('/get-dev-token')
        .expect(200);
      
      expect(res.body).to.have.property('data', process.env.DEVELOPER_TOKEN);
    });
  });

  describe('GET * (Catch-all)', () => {
    it('should serve index.html for unknown routes', async () => {
      const res = await request(app)
        .get('/some/random/path')
        .expect(200);
      
      // Check for some common HTML snippet (this may vary based on your index.html)
      expect(res.text).to.include('<html');
    });
  });
});