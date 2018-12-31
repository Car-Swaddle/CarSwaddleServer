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

        const { sourceID, priceID, mechanicID, autoServiceID } = req.body;

        if (sourceID == null || priceID == null || mechanicID == null || autoServiceID == null) {
            return res.status(422);
        }

        var price = await models.Price.findById(priceID);
        var priceParts = await price.getPriceParts();
        var mechanic = await models.Mechanic.findById(mechanicID);
        var autoService = await models.AutoService.findById(autoServiceID);

        if (price == null || priceParts == null || mechanic == null || autoService == null) {
            return res.status(422);
        }

        const destinationAmount = generateDestinationAmount();

        stripe.charges.create({
            amount: price.totalPrice,
            currency: "usd",
            source: sourceID,
            description: "Oil Change from Car Swaddle",
            statement_descriptor: "Car Swaddle Oil Change",
            destination: {
                account: mechanic.stripeCustomerID,
                amount: destinationAmount,
            },
            receipt_email: req.user.email,
            metadata: {
                mechanicID: mechanicID,
                userID: req.user.id,
                priceID: price.id,
                autoServiceID: autoServiceID,
            }
        }, function (err, charge) {
            console.log(charge);
        });
    });

    function generateDestinationAmount(priceParts, price) {
        const subtotalPricePart = priceParts.find(x => x.key === 'subtotal')[0];
        return subtotalPricePart.value
    }

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