const jwt = require('jsonwebtoken');
const uuidV1 = require('uuid/v1');
const constants = require('../controllers/constants.js');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');


module.exports = function (app, models, passport) {

    const emailFile = require('../notifications/email.js');
    const emailer = new emailFile(models);

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
                    models.Mechanic.findOrCreate({
                        where: { userID: user.id },
                        defaults: { isActive: true, id: uuidV1() }
                    }).spread(function (mechanic, created) {
                        if (created == true) {
                            stripe.accounts.create(stripeCreateDict(req.connection.remoteAddress)).then(stripeAccount => {
                                models.OilChangePricing.findOrCreate({
                                    where: { mechanicID: mechanic.id },
                                    defaults: { id: uuidV1() }
                                }).spread(async function (oilChangePricing, created) {
                                    await oilChangePricing.setMechanic(mechanic);
                                    await oilChangePricing.save();
                                    user.setMechanic(mechanic).then(function () {
                                        mechanic.stripeAccountID = stripeAccount.id;
                                        mechanic.save().then(mechanic => {
                                            return res.json({ user, mechanic, token });
                                        });
                                    });
                                });
                            });
                        } else {
                            models.OilChangePricing.findOrCreate({
                                where: { mechanicID: mechanic.id },
                                defaults: { id: uuidV1() }
                            }).spread(async function (oilChangePricing, created) {
                                await oilChangePricing.setMechanic(mechanic);
                                await oilChangePricing.save();
                                user.setMechanic(mechanic).then(function () {
                                    return res.json({ user, mechanic, token });
                                });
                            });
                        }
                    });
                } else {
                    return res.json({ user, token });
                }
            });
        })
            (req, res);

    });

    app.post('/signup', bodyParser.urlencoded({ extended: true }), function (req, res, next) {
        passport.authenticate('local-signup', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(400).json({
                    message: info ? info.message : 'Sign up failed',
                    user: user
                });
            }

            stripe.customers.create({
                email: user.email
            }, function (err, customer) {

                if (customer == null || err != null) {
                    return res.status(422).send();
                }

                user.stripeCustomerID = customer.id;
                user.save().then(user => {
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
                            models.Mechanic.findOrCreate({
                                where: { userID: user.id },
                                defaults: { isActive: true, id: uuidV1() }
                            }).spread(function (mechanic, created) {
                                if (created == true) {
                                    stripe.accounts.create(stripeCreateDict(req.connection.remoteAddress)).then(stripeAccount => {
                                        models.OilChangePricing.findOrCreate({
                                            where: { mechanicID: mechanic.id },
                                            defaults: { id: uuidV1() }
                                        }).spread(async function (oilChangePricing, created) {
                                            await oilChangePricing.setMechanic(mechanic);
                                            await oilChangePricing.save();
                                            user.setMechanic(mechanic).then(function () {
                                                mechanic.stripeAccountID = stripeAccount.id;
                                                mechanic.save().then(mechanic => {
                                                    return res.json({ user, mechanic, token });
                                                });
                                            });
                                        });
                                    });
                                } else {
                                    user.setMechanic(mechanic).then(function () {
                                        return res.json({ user, mechanic, token });
                                    });
                                }
                            });
                        } else {
                            return res.json({ user, token });
                        }
                    });
                });
            });
        })
            (req, res);

    });

    function stripeCreateDict(ip) {
        return {
            country: 'US',
            type: 'custom',
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: ip
            },
            business_type: 'individual',
        }
    }


};





