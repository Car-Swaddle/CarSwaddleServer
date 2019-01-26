var express = require('express');
var models = require('./src/models');
var bodyParser = require('body-parser');
const path = require('path');

const associationFilePath = 'src/resources/apple-app-site-association';

bodyParser.limit = '500mb';

var app = express();
app.use(express.static(__dirname + '/www'));
// app.use('/.wellknown/apple-app-site-association', express.static(path.resolve(associationFilePath)));

var port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port);

console.log('working on ' + process.env.PORT);

const passport = require('./passport')(models);

require('./src/routes')(app, models, passport);
