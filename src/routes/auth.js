const jwt = require('jsonwebtoken');
const uuidV1 = require('uuid/v1');
const constants = require('../controllers/constants.js');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const accountCreationFile = require('../controllers/account-creation.js');


module.exports = function (app, models, passport) {

    const emailFile = require('../notifications/email.js');
    const emailer = new emailFile(models);
    const accountCreation = accountCreationFile(models);

    app.post('/login', bodyParser.urlencoded({ extended: true }), function (req, res, next) {
        passport.authenticate('local-login', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(400).json({
                    message: info ? info.message : 'Login failed',
                    user: user
                });
            }
            req.login(user, { session: false }, (err) => {
                if (err) {
                    return res.send(err);
                }

                const token = jwt.sign(user.dataValues, 'your_jwt_secret');

                if (req.query.isMechanic == "true") {
                    accountCreation.completeMechanicCreationOrUpdate(user, req.connection.remoteAddress, function (err, mechanic) {
                        return res.json({ user, mechanic, token });
                    });
                } else {
                    return res.json({ user, token });
                }
            });
        })(req, res);
    });

    app.post('/signup', bodyParser.urlencoded({ extended: true }), function (req, res, next) {
        passport.authenticate('local-signup', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(400).json({
                    message: info ? info.message : 'Sign up failed',
                    user: user
                });
            }

            accountCreation.createStripeCustomerAccount(user, function (err, customer, user) {
                if (customer == null || err != null || user == null) {
                    return res.status(422).send();
                }

                req.login(user, { session: false }, (err) => {
                    if (err) {
                        res.send(err);
                    }

                    const token = jwt.sign(user.dataValues, 'your_jwt_secret');

                    if (!user.isEmailVerified) {
                        emailer.sendEmailVerificationEmail(user, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }

                    if (req.query.isMechanic == "true") {
                        accountCreation.completeMechanicCreationOrUpdate(user, req.connection.remoteAddress, function (err, mechanic) {
                            return res.json({ user, mechanic, token });
                        });
                    } else {
                        return res.json({ user, token });
                    }
                });
            });
        })(req, res);
    });

};
