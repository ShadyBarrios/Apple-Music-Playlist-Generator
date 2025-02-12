import * as chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../src/server.js';

chai.use(chaiHttp);
const expect = chai.expect;
const request = chai.request;

describe('API Tests', function() {
  describe('GET /*', function() {
    it('should return the index.html file', function(done) {
      request(app)
        .get('/')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.include('</html>');
          done();
        });
    });
  });

  describe('POST /api/login', function() {
    it('should authenticate successfully', function(done) {
      request(app)
        .post('/api/login')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Login successful with token from .env file');
          done();
        });
    });

    it('should return an error when USER_TOKEN is missing', function(done) {
      request(app)
        .post('/api/login')
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error', 'User token not available');
          done();
        });
    });
  });
});