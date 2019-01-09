const jwt = require('jsonwebtoken');
const uuidV1 = require('uuid/v1');
const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const endpointSecret = 'whsec_Mihcejqv5prmk29eoHGuytmCFOwfDqzG';

module.exports = function (app, models) {

    app.post('/stripe-webhook', function (req, res) {
        let sig = req.headers["stripe-signature"];

        var event = null;
        try {
          event = stripe.webhooks.constructEvent(req.body.asText, sig, endpointSecret);
        } catch (err) {
          return res.status(406).end();
        }

        console.log(event);
        
        return res.json({received: true});
    });

};