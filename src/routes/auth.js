const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const accountCreationFile = require('../controllers/account-creation.js');
const express = require('express');
const ReferrerController = require("../controllers/referrer");

module.exports = function (app, models, passport) {

    const emailFile = require('../notifications/email.js');
    const emailer = new emailFile(models);
    const accountCreation = accountCreationFile(models);
    const resetPasswordController = require('../controllers/passwordReset')(models);
    const referrerController = new ReferrerController();

    const createJWTFromUser = (user) => {
        return {
            id: user.id
        }
    }

    const loginAccountLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 1 hour window
        max: 50, // start blocking after 50 requests
      });

    const createAccountLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minute window
        max: 15, // start blocking after 15 requests
      });

    app.post('/login', loginAccountLimiter, express.urlencoded({ extended: true }), function (req, res, next) {
        passport.authenticate('local-login', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(400).json({
                    message: info ? info.message : 'Login failed',
                    user: user
                });
            }
            req.login(user, { session: false }, async (err) => {
                if (err) {
                    return res.send(err);
                }

                const token = jwt.sign(createJWTFromUser(user), 'your_jwt_secret');
                res.setHeader('Set-Cookie', 'cs-jwt=' + token);

                if (req.query.isMechanic == "true") {
                    accountCreation.completeMechanicCreationOrUpdate(user, req.connection.remoteAddress, function (err, mechanic) {
                        return res.json({ user, mechanic, token });
                    });
                } else if (req.query.isReferrer == "true") {
                    const referrer = await referrerController.getReferrerForUserID(user.id);
                    return res.json({ user, referrer, token });
                } else {
                    return res.json({ user, token });
                }
            });
        })(req, res);
    });

    app.post('/signup', createAccountLimiter, express.urlencoded({ extended: true }), function (req, res, next) {
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

                    const token = jwt.sign(createJWTFromUser(user), 'your_jwt_secret');

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


    app.post('/api/request-reset-password', loginAccountLimiter, express.urlencoded({ extended: true }), function (req, res) {
        const email = req.body.email;
        const appName = req.body.appName || 'car-swaddle';
        if (!email) {
            return res.status(403).send('Must include email');
        }
        resetPasswordController.requestResetPassword(email, appName, (err, resetPassword) => {
            if (!err) {
                return res.status(200).send({ 'success': true });
            } else if (err == 404) {
                return res.status(404).send('error generating password reset');
            } else {
                return res.status(403).send('error generating password reset');
            }
        });
    });

    app.post('/api/reset-password', loginAccountLimiter, express.urlencoded({ extended: true }), function (req, res) {
        const newPassword = req.body.newPassword;
        const token = req.body.token;
        if (!newPassword || !token) {
            return res.status(403).send('Must include email');
        }
        resetPasswordController.setNewPassword(token, newPassword, (err, user) => {
            if (!err) {
                return res.status(200).send(user);
            } else if (err == 404) {
                return res.status(404).send('error generating password reset');
            } else {
                return res.status(403).send(err);
            }
        });
    });

    app.get('/email-unsubscribe', express.json(), function (req, res) {
        const unsubscribeID = req.query.unsubscribeID;
        if (!unsubscribeID) {
            return res.status(422).send('Invalid parameter(s)');
        }

        return models.SubscriptionSettings.findOne({
            where: { unsubscribeID: unsubscribeID }
        }).then(subscriptionSettings => {
            subscriptionSettings.sendReminderEmails = false
            subscriptionSettings.save().then(settings => {
                return res.status(400).send('Successfully Unsubscribed');
            }).catch(err => {
                return res.status(403).send('Unable to unsubscribe');
            })
        }).catch(error => {
            return res.status(403).send('Unable to unsubscribe');
        });
    });

};
