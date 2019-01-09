const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const liveEndpointSecret = 'whsec_w70LXPKXB954f8H41fKnc7HBIwrBHyoT';
const testEndpointSecret = 'whsec_Mihcejqv5prmk29eoHGuytmCFOwfDqzG';

module.exports = function (app, models) {

    app.use(require('body-parser').raw({type: '*/*'}));

    app.post('/stripe-webhook', function (req, res) {
        let sig = req.headers["stripe-signature"];

        var event = null;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, liveEndpointSecret);
        } catch (err) {
            return res.send(err);
        }

        console.log(event);

        return res.json({ received: true });
    });

};