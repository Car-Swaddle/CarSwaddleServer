'use strict;'

const { execSync } = require('child_process');
var request = require('superagent');

process.env.HOST_URL = process.env.HOST_URL || 'http://localhost:3000'
process.env.TEST_USER = process.env.TEST_USER || 'test@carswaddle.com'
process.env.TEST_PASS = process.env.TEST_PASS || 'Test123!'
process.env.TEST_JWT = "";

console.log("Host url: " + process.env.HOST_URL)
console.log("Test user: " + process.env.TEST_USER)
console.log("Test pass: " + process.env.TEST_PASS)

encodedUser = encodeURIComponent(process.env.TEST_USER)
encodedPass = encodeURIComponent(process.env.TEST_PASS)
body = "email=" + encodedUser + "&password=" + encodedPass;
console.log(body);

function runTests(token) {
    process.env.TEST_JWT = token;
    execSync(
        'mocha ./built/test/**/*.*s',
        {stdio: 'inherit'}
    );
}

function signup() {
    request.post(process.env.HOST_URL + "/signup")
    .send(body)
    .then(res => {
        runTests(res.body.token);
    })
    .catch(err => {
        console.error("Failed to login and sign up:");
        console.error(err);
    })
}

function login() {
    // Login, then signup if login failed
    request.post(process.env.HOST_URL + "/login")
    .send(body)
    .then(res => {
        if (res.status != 200) {
            // User probably doesn't exist yet
            signup();
        } else {
            runTests(res.body.token);
        }
    })
    .catch(err => {
        if (err && err.response) {
            // User probably doesn't exist yet
            console.info("Error logging in: " + JSON.stringify(err));
            signup();
        }
    })
}

login()
