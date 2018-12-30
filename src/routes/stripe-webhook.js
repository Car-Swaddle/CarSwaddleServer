const jwt = require('jsonwebtoken');
const uuidV1 = require('uuid/v1');
const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);


module.exports = function (app, models) {

    app.post('/stripe-webhook', function (req, res) {
        if (req.body == null) {
            return res.status(422);
        }
        const eventJSON = JSON.parse(req.body);
        console.log(eventJSON);
        return res.send(200);
    });

};