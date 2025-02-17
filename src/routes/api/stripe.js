const express = require('express');
const constants = require('../../controllers/constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fileStore = require('../../data/file-store.js');
const uuidV1 = require('uuid/v1');
const axios = require('axios');
const queryString = require('querystring');
const ReferrerController = require('../../controllers/referrer');

module.exports = function (router, models) {
    const referrerController = new ReferrerController();
    const authoritiesController = require('../../controllers/authorities')(models);

    // TODO - move this down to controller level, duplicate of referrer api
    async function checkIsCurrentReferrerOrAdmin(referrerId, req, res) {
        if (await authoritiesController.hasAuthority(req.user.id, models.Authority.NAME.readReferrers)) {
            return;
        }
        
        const referrer = await models.Referrer.findByPk(referrerId);
        if (!referrer) {
            res.sendStatus(404);
            throw 'Referrer not found';
        }
        if (referrer.userID !== req.user.id) {
            res.sendStatus(403);
            throw 'No access to referrer';
        }
    }
    
    router.get('/stripe/account', bodyParser.json(), async (req, res) => {
        const mechanic = await req.user.getMechanic();
        stripe.accounts.retrieve(mechanic.stripeAccountID, (err, account) => {
            if (err != null || account == null) {
                return res.status(400).send();
            }
            return res.json(account);
        });
    });

    router.get('/stripe/oauth-confirm', express.json(), async function (req, res) {
        const isReferrer = req.query.isReferrer ?? true;
        if (!req.query.code) {
            res.sendStatus(400);
            return;
        }

        if (isReferrer) {
            // Post confirm with code to stripe
            const query = queryString.stringify({
                grant_type: 'authorization_code',
                client_id: constants.STRIPE_CONNECT_CLIENT_ID,
                client_secret: constants.STRIPE_SECRET_KEY,
                code: req.query.code
            })
            try {
                const response = await axios.post("https://connect.stripe.com/oauth/token",
                    query,
                    { headers: {'Content-Type': 'application/x-www-form-urlencoded'} }
                );
                if (!response || response.error || !response.data) {
                    throw "Missing data in stripe response";
                }
                const stripeAccountID = response.data.stripe_user_id;
                
                const referrer = await referrerController.createReferrerForUserWithExistingStripeAccount(req.user.id, stripeAccountID);
                res.json(referrer);
            }
            catch(err) {
                console.log(err)
                return res.sendStatus(err.status || 400);
            }
            
            const stripeAccountID = response.data.stripe_user_id;

            // Manual payout schedule
            await stripe.accounts.update(stripeAccountID, {
                settings: {
                    payouts: {
                        schedule: {
                            interval: "manual"
                        }
                    }
                }
            });
            
            const referrer = await referrerController.createReferrerForUserWithExistingStripeAccount(req.user.id, stripeAccountID);
            res.json(referrer);
        } else {
            // Unhandled, might use for mechanic in the future
            res.sendStatus(400);
        }
    });

    router.get('/stripe/express-login-link', express.json(), async function (req, res) {
        const redirectPath = req.query.redirect;
        const referrerID = req.query.referrerID;

        checkIsCurrentReferrerOrAdmin(referrerID, req, res);
    
        const referrer = await models.Referrer.findByPk(referrerID);

        if (!redirectPath || !referrer || !referrer.stripeExpressAccountID) {
            return res.status(400).send("Missing redirect link or stripe account");
        }

        const loginLink = await stripe.accounts.createLoginLink(referrer.stripeExpressAccountID, {
            redirect_url: process.env.PUBLIC_URL + redirectPath
        })

        return res.json({link: loginLink.url});
    })

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
                if (account.requirements == null) {
                    return res.status(400).send();
                }
                return res.json(account.requirements);
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