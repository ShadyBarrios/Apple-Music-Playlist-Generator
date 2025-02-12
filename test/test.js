import * as chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../src/server.js';

chai.use(chaiHttp);
const expect = chai.expect;
const request = chai.request;

describe('API Tests for /api/login', function() {
    it('should authenticate successfully', function(done) {
      process.env.USER_TOKEN = 'test_token';
  
      chai.request(app)
        .post('/api/login')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Login successful with token from .env file');
          done();
        });
    });
  
    it('should return an error when USER_TOKEN is missing', function(done) {
      delete process.env.USER_TOKEN;
  
      chai.request(app)
        .post('/api/login')
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error', 'User token not available');
          done();
        });
    });
  
    after(() => {
      process.env.USER_TOKEN = 'original_user_token';
    });
  });