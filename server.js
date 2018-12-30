var express = require('express');
var models = require('./src/models');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json({ type: 'application/*+json' }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(bodyParser.json({ type: 'application/x-www-form-urlencoded' }))

app.use(express.static(__dirname + '/www'));

var port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port);

console.log('working on ' + process.env.PORT);

const passport = require('./passport')(models);

require('./src/routes')(app, models, passport);
