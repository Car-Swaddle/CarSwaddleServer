const express = require('express');
const constants = require('../constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

module.exports = function (router, models) {

    router.post('/stripe/ephemeral-keys', bodyParser.json(), (req, res) => {
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

    router.get('/stripe/verification', bodyParser.json(), function (req, res) {
        req.user.getMechanic().then(mechanic => {
            if (mechanic == null) {
                return res.status(400).send();
            }
            stripe.accounts.retrieve(mechanic.stripeAccountID, (err, account) => {
                if (err != null || account == null) {
                    return res.status(400).send();
                }
                if (account.verification == null) {
                    return res.status(400).send();
                }
                return res.json(account.verification);
            });
        });
    });

    router.get('/stripe/balance', bodyParser.json(), async function (req, res) {
        const mechanic = await req.user.getMechanic();

        if (mechanic == null || mechanic.stripeAccountID == null) {
            return res.status(422).send('invalid parameters');
        }

        stripe.balance.retrieve({
            stripe_account: mechanic.stripeAccountID,
        }, function (err, balance) {
            if (err != null || balance == null) {
                return res.status(422).send('invalid parameters');
            }
            return res.json(balance);
        });
    });

    router.get('/stripe/transactions', bodyParser.json(), async function (req, res) {
        const mechanic = await req.user.getMechanic();

        if (mechanic == null || mechanic.stripeAccountID == null) {
            return res.status(422).send('invalid parameters');
        }

        const startingAfterID = req.query.startingAfterID;
        const payoutID = req.query.payoutID;
        const limit = req.query.limit || 30;

        stripe.balance.listTransactions({
            limit: limit,
            starting_after: startingAfterID,
            payout: payoutID,
        }, { stripe_account: mechanic.stripeAccountID }, function (err, transactions) {
            if (err != null || transactions == null) {
                return res.status(422).send('invalid parameters');
            }
            return res.json(transactions);
        });
    });

    router.get('/stripe/payouts', bodyParser.json(), async function (req, res) {
        const mechanic = await req.user.getMechanic();

        if (mechanic == null || mechanic.stripeAccountID == null) {
            return res.status(422).send('invalid parameters');
        }

        const startingAfterID = req.query.startingAfterID;
        const limit = req.query.limit || 30;

        stripe.payouts.list({
            limit: limit,
            starting_after: startingAfterID,
        }, { stripe_account: mechanic.stripeAccountID }, function (err, payouts) {
            if (err != null || payouts == null) {
                return res.status(422).send('invalid parameters');
            }
            return res.json(payouts);
        });
    });

    return router;
};