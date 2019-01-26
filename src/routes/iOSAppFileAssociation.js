const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const associationFilePath = 'src/resources/apple-app-site-association';

module.exports = function (app, models, passport) {

    app.get('/someTest/apple-app-site-association', bodyParser.json(), function (req, res, next) {
        return res.sendfile(path.resolve(associationFilePath));
    });
};