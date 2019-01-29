const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const associationFilePath = 'src/resources/apple-app-site-association';

module.exports = function (app, models, passport) {

    app.get('/.well-known/apple-app-site-association', bodyParser.json(), function (req, res, next) {
        res.setHeader("Content-Type", "application/json");
        return res.download(path.resolve(associationFilePath));
    });

    app.get('/apple-app-site-association', bodyParser.json(), function (req, res, next) {
        res.setHeader("Content-Type", "application/json");
        return res.download(path.resolve(associationFilePath));
        // return res.sendFile(path.resolve(associationFilePath));
    });

};