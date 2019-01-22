const jwt = require('jsonwebtoken');
const constants = require('../constants');
const bodyParser = require('body-parser');


module.exports = function (app, models) {

    app.post('/logout', bodyParser.json(), function (req, res, next) {
        if (req.body.deviceToken != null) {
            return res.status(200).send('Unable to remove device token');
        }
        const token = req.body.deviceToken;
        models.DeviceToken.findOne({ where: { token: token } }).then(deviceToken => {
            if (deviceToken == null) {
                return res.status(400).send('unable to fetch');
            }
            deviceToken.destroy().then(value => {
                return res.status(200).send();
            });
        }).catch(error => {
            return res.status(400).send('unable to fetch');
        });
    });

};