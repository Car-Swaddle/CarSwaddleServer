const jwt = require('jsonwebtoken');
const uuidV1 = require('uuid/v1');
const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const liveEndpointSecret = 'whsec_w70LXPKXB954f8H41fKnc7HBIwrBHyoT';
const testEndpointSecret = 'whsec_Mihcejqv5prmk29eoHGuytmCFOwfDqzG';

function addRawBody(req, res, next) {
    req.setEncoding('utf8');
    console.log('adding raw body');
    var data = '';

    req.on('data', function (chunk) {
        data += chunk;
        console.log('chunking data');
    });

    req.on('end', function () {
        req.rawBody = data;
        console.log('set raw body');
        next();
    });
}

module.exports = function (app, models) {

    app.post('/stripe-webhook', addRawBody, function (req, res) {
        let sig = req.headers["stripe-signature"];

        var event = null;
        try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, testEndpointSecret);
        } catch (err) {
            return res.send(err);
        }

        console.log(event);

        return res.json({ received: true });
    });

};