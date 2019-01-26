const bodyParser = require('body-parser');
const fs = require('fs')

const associationFilePath = '../resources/apple-app-site-association';

module.exports = function (app, models, passport) {

    app.get('/apple-app-site-association', bodyParser.json(), function (req, res, next) {
        fs.readFile(__dirname + '/' + associationFilePath, 'utf8', function (err, data) {
            if (data == null) {
                console.log(err);
                res.status(404).send();
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(data, 'binary');
            res.end(null, 'binary');
        });
    });
};