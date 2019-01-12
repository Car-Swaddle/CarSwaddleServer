const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const pushService = require('../notifications/pushNotifications.js');
const liveEndpointSecret = 'whsec_w70LXPKXB954f8H41fKnc7HBIwrBHyoT';
const testEndpointSecret = 'whsec_Mihcejqv5prmk29eoHGuytmCFOwfDqzG';

module.exports = function (app, models) {

// bodyParser.raw({ type: '*/*' })
// bodyParser.json()

    app.post('/stripe-webhook', bodyParser.json(), function (req, res) {
        let sig = req.headers["stripe-signature"];

        var event = null;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, testEndpointSecret);
        } catch (err) {
            return res.send(err);
        }

        // const event = req.body;

        console.log(event);

        const destination = event.data.object.destination;

        if (event.type == eventTypes.PAYOUT_PAID) {
            const amount = event.data.object.amount;
            if (destination != null && amount != null) {
                findMechanicWithDestination(destination).then(mechanic => {
                    if (mechanic == null) {
                        return res.json({ received: true });
                    }
                    const dollars = dollarFormat(amount);
                    const alert = 'A payout was paid of $' + dollars;
                    const title = 'Payout: $' + dollars;
                    pushService.sendMechanicNotification(mechanic, alert, null, null, null, title);
                });
            }
        } else if (event.type == eventTypes.PAYOUT_CANCELED) {

        } else if (event.type == eventTypes.PAYOUT_CREATED) {

        } else if (event.type == eventTypes.PAYOUT_FAILED) {

        } else if (event.type == eventTypes.PAYOUT_UPDATED) {

        } else if (event.type == eventTypes.ACCOUNT_UPDATED) {
            const verification = event.data.object.verification;
            if (verification != null) {

            }
        }


        return res.json({ received: true });
    });

    function findMechanicWithDestination(destination) {
        return models.Mechanic.findOne({ where: { stripeAccountID: destination } });
    }

    function dollarFormat(cents) {
        return (cents/100.0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    var eventTypes = {
        PAYOUT_PAID: 'payout.paid',
        PAYOUT_CANCELED: 'payout.canceled',
        PAYOUT_CREATED: 'payout.created',
        PAYOUT_FAILED: 'payout.failed',
        PAYOUT_UPDATED: 'payout.updated',
        ACCOUNT_UPDATED: 'account.updated',
    }

};