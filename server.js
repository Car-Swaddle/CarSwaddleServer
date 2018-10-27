var express = require('express');
var models = require('./src/models');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json({ type: 'application/*+json' }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(bodyParser.json({ type: 'application/x-www-form-urlencoded'}))

app.use(express.static(__dirname + '/www'));

app.listen('3000');
console.log('working on 3000');


// const auth = require('./src/routes/auth');
// const user = require('./src/routes/user');


// app.use('./src/routes/auth', auth);
// app.use('./src/routes/user', passport.authenticate('jwt', {session: false}), user);

const passport = require('./passport')(models);

require('./src/routes')(app, models, passport);
