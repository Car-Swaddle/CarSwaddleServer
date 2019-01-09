const jwt = require('jsonwebtoken');
const uuidV1 = require('uuid/v1');
const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const endpointSecret = 'whsec_w70LXPKXB954f8H41fKnc7HBIwrBHyoT';

module.exports = function (app, models) {

    app.post('/stripe-webhook', function (req, res) {
        const sig = req.headers.stripe-signature;

        var event = null;
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
          res.status(400).end();
        }

        console.log(event);
        
        return res.json({received: true});
    });

};