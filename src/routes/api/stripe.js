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

    router.get('/stripe/transaction-details', bodyParser.json(), async function (req, res) {
        const mechanic = await req.user.getMechanic();
        const transactionID = req.query.transactionID;

        if (mechanic == null || mechanic.stripeAccountID == null || transactionID == null) {
            return res.status(422).send('invalid parameters');
        }

        stripe.issuing.transactions.retrieve(transactionID, { stripe_account: mechanic.stripeAccountID }, function (err, transaction) {
            if (err != null || transaction == null) {
                return res.status(422).send('invalid parameters');
            }
            return res.json(transaction);
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
        const status = req.query.status;

        stripe.payouts.list({
            limit: limit,
            starting_after: startingAfterID,
            status: status,
        }, { stripe_account: mechanic.stripeAccountID }, function (err, payouts) {
            if (err != null || payouts == null) {
                return res.status(422).send('invalid parameters');
            }
            return res.json(payouts);
        });
    });

    router.get('/stripe/payout', bodyParser.json(), async function (req, res) {
        const mechanic = await req.user.getMechanic();

        const payoutID = req.query.payoutID;

        if (payoutID == null) {
            return res.status(422).send('invalid parameters');
        }

        stripe.payouts.retrieve(payoutID, { stripe_account: mechanic.stripeAccountID }, function (err, payout) {
            if (err != null || payout == null) {
                return res.status(422).send('invalid parameters');
            }
            return res.json(payout);
        });
    });

    return router;
};