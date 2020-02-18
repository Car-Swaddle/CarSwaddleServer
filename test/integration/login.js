'use strict';

var request = require('supertest');
var host_url = process.env.HOST_URL;
var jwt = process.env.TEST_JWT;

let host_request = request(host_url);
describe('Account management', function() {
    it('Should create account', function(done) {
        host_request.post('/signup')
        .send("email=" + encodeURIComponent("brad+" + Math.floor(new Date() / 1000) + "@carswaddle.com")
        + "&password=1234")
        .expect(200, done);
    });

    it('Should not create account that exists', function(done) {
        host_request.post('/signup')
        .send("email=" + encodeURIComponent("test@carswaddle.com")
        + "&password=1234")
        .expect(400, done);
    });

    it('Should not login with bad password', function(done) {
        host_request.post('/login')
        .send("email=" + encodeURIComponent("test@carswaddle.com")
        + "&password=asdfasdf)")
        .expect(400, done);
    });
});