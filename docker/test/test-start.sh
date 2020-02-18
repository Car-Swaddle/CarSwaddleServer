#!/bin/bash

export HOST_URL=${HOST_URL:-'http://localhost:3000'}
export TEST_USER=${TEST_USER:-'test@carswaddle.com'}
export TEST_PASS=${TEST_PASS:-'Test123!'}

echo $HOST_URL
echo $TEST_USER
echo $TEST_PASS

# Before test user creation/login
ENC_USER=$(node -e "encodeURIComponent('$TEST_USER')")
ENC_PASS=$(node -e "encodeURIComponent('$TEST_PASS')")
BODY="email=$ENC_USER&password=$ENC_PASS"

TOKEN=$(http POST "$HOST_URL/login" body=$BODY | jq '.token' -r)
echo $TOKEN

# process.env.TEST_JWT = "";

# function signUp() {
#     request.post(process.env.HOST_URL + "/signup")
#     .send(body)
#     .then(res => {
#         console.error(here2);
#         return res.body.token;
#     })
#     .catch(err => {
#         console.error(here22);
#         console.error(err);
#     })
# }

# const res = await request.post(process.env.HOST_URL + "/login").send(body);
# console.error(res);

# export TEST_JWT=$(node ./docker/test/test-prep.js)
# echo $TEST_JWT

# Run all *.js/*.ts
mocha ./test/**/*.*s
