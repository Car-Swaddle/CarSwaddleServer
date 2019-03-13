const express = require('express');
const constants = require('../constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fileStore = require('../../data/file-store.js');
const uuidV1 = require('uuid/v1');

module.exports = function (router, models) {

    router.get('/stripe/externalAccount', bodyParser.json(), async (req, res) => {
        const mechanic = await req.user.getMechanic();
        stripe.accounts.retrieve(mechanic.stripeAccountID, (err, account) => {
            if (err != null || account == null) {
                return res.status(400).send();
            }
            if (account.external_accounts.data == null || 
                account.external_accounts.data.length == 0 ||
                account.external_accounts.data[0].id == null ) {
                return res.status(400).send();
            }
            stripe.accounts.retrieveExternalAccount(
                mechanic.stripeAccountID,
                account.external_accounts.data[0].id,
                function (err, external_account) {
                    return res.json(external_account);
                }
            );
        });
    });

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
        fetchTransaction(transactionID, mechanic, function (transaction, transactionMetadata, err) {
            if (err != null || transactionMetadata == null) {
                return res.status(422).send('invalid parameters');
            }

            return res.json(transaction);
        });
    });

    router.patch('/stripe/transaction-details', bodyParser.json(), async function (req, res) {
        const mechanic = await req.user.getMechanic();
        const transactionID = req.body.transactionID;
        const cost = parseInt(req.body.cost, 10); // in cents
        const distance = parseInt(req.body.distance, 10); // in meters

        if (mechanic == null || transactionID == null || (!(cost) && !(distance))) {
            return res.status(422).send('invalid parameters');
        }

        fetchTransaction(transactionID, mechanic, async function (transaction, transactionMetadata, err) {
            if (err != null) {
                return res.status(422).send('invalid parameters');
            }

            if (cost) {
                transactionMetadata.mechanicCost = cost;
            }
            if (distance) {
                transactionMetadata.drivingDistance = distance;
            }
            const savedTransactionMetadata = await transactionMetadata.save();
            if (savedTransactionMetadata == null) {
                return res.status(422).send('invalid parameters');
            }
            transaction.car_swaddle_meta = savedTransactionMetadata.toJSON();
            return res.json(transaction);
        });
    });

    router.post('/stripe/transaction-details/receipt', fileUpload(), async function (req, res) {
        const mechanic = await req.user.getMechanic();
        const transactionID = req.query.transactionID;

        if (mechanic == null || transactionID == null) {
            return res.status(422).send('invalid parameters');
        }

        if (req.files == null) {
            return res.status(400).send('No files were uploaded.');
        }
        if (Object.keys(req.files).length == 0) {
            return res.status(400).send('No files were uploaded.');
        }

        fetchTransaction(transactionID, mechanic, async function (transaction, transactionMetadata, err) {
            if (err != null) {
                return res.status(422).send('invalid parameters');
            }
            let file = req.files.image;
            const newFileName = await fileStore.uploadImage(file.data, null);
            console.log(newFileName);
            if (newFileName == null) {
                return res.status(400).send('Unable to upload image');
            }
            const transactionReceipt = await models.TransactionReceipt.create({ id: uuidV1(), receiptPhotoID: newFileName })
            transactionReceipt.setTransactionMetadatum(transactionMetadata, { save: false });
            transactionReceipt.save().then(receipt => {
                return res.status(200).json(receipt);
            }).catch(error => {
                return res.status(400).send('Unable to upload image to user');
            });
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

    function fetchTransaction(stripeTransactionID, mechanic, callback) {
        stripe.balance.retrieveTransaction(stripeTransactionID, { stripe_account: mechanic.stripeAccountID }, function (err, transaction) {
            if (err != null || transaction == null) {
                return callback(null, null, err);
            }
            models.TransactionMetadata.findOne({
                where: { stripeTransactionID: stripeTransactionID },
                include: [{ model: models.TransactionReceipt }]
            }).then(transactionMetadata => {
                if (err != null && transactionMetadata != null) {
                    return callback(null, null, err);
                }
                transaction.car_swaddle_meta = transactionMetadata.toJSON();
                callback(transaction, transactionMetadata);
            });
        });
    }

    return router;
};