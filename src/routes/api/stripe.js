const express = require('express');
const constants = require('../constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);

module.exports = function (router, models) {

    router.post('/stripe/ephemeral-keys', (req, res) => {
        const apiVersion = req.query.apiVersion;
        if (!apiVersion) {
            res.status(400).end();
            return;
        }

        stripe.ephemeralKeys.create(
            { customer: req.user.stripeCustomerID },
            { stripe_version: apiVersion },
        ).then((key) => {
            res.status(200).json(key);
        }).catch((err) => {
            res.status(500).end();
        });
    });

    router.post('/create-charge', async (req, res) => {

        const { sourceID, priceID, mechanicID } = req.body;

        if (sourceID == null || priceID == null || mechanicID == null) {
            return res.status(422);
        }

        var price = await models.Price.findById(priceID);
        var mechanic = await models.Mechanic.findById(mechanicID);

        stripe.charges.create({
            amount: price.totalPrice,
            currency: "usd",
            source: sourceID,
            description: "Charge for oil change " + req.user.displayName(),
            application_fee: constants.BOOKING_FEE,
            destination: {
                account: mechanic.stripeCustomerID,
            },
        }, function (err, charge) {
            console.log(charge);
        });
    });

    router.post('/stripe-webhook', function (req, res) {
        const eventJSON = JSON.parse(req.body);
        console.log(eventJSON);
        return res.send(200);
    });

    router.get('/stripe/verification', function (req, res) {
        req.user.getMechanic().then(mechanic => {
            if (mechanic == null) {
                return res.status(400);
            }
            stripe.accounts.retrieve(mechanic.stripeAccountID, (err, account) => {
                if (err != null || account == null) {
                    return res.status(400);
                }
                if (account.verification == null) {
                    return res.status(400);
                }
                // if (account.verification.fields_needed == null) {
                //     return res.status(400);
                // }
                return res.json(account.verification);
            });
        });
    });

    return router;
};