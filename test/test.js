import * as chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../src/server.js'; // Make sure the path to your server file is correct

chai.use(chaiHttp); // This is how you correctly apply chaiHttp to chai
const { expect } = chai; // This extracts expect from chai to be used for assertions

console.log(chai);
console.log(chaiHttp);

describe('Simple chai-http test', () => {
  it('should access the app', (done) => {
    chai.request(app)
      .get('/')  // Assuming there's a root route
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res).to.have.status(200);
          done();
        }
      });
  });
});

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