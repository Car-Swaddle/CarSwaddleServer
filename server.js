var express = require('express');
var models = require('./src/models');
var bodyParser = require('body-parser');

bodyParser.limit = '500mb';

var app = express();
// app.use(express.static('static-files'))
app.use(express.static(__dirname + '/www'));
// app.use('/.wellknown/apple-app-site-association', express.static(path.resolve(associationFilePath)));

// app.use('/robots.txt', function (req, res, next) {
//     res.type('text/plain')
//     res.send("User-agent: *\nAllow: /apple-app-site-association");
// });

var port = process.env.PORT;
if (port == null || port == "") {
    port = 5432;
}
app.listen(port);

console.log('working on ' + port);

const passport = require('./passport')(models);

require('./src/routes')(app, models, passport);
