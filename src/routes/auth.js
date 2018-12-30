const jwt = require('jsonwebtoken');
const uuidV1 = require('uuid/v1');
const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);


module.exports = function (app, models, passport) {

    app.post('/login', function (req, res, next) {
        passport.authenticate('local-login', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(400).json({
                    message: info ? info.message : 'Login failed',
                    user: user
                });
            }
            req.login(user, { session: false }, (err) => {
                if (err) {
                    res.send(err);
                }

                const token = jwt.sign(user.dataValues, 'your_jwt_secret');

                if (req.query.isMechanic == "true") {
                    models.Mechanic.findOrCreate({ where: { userID: user.id }, defaults: { isActive: true, id: uuidV1() } })
                        .spread(function (mechanic, created) {
                            user.setMechanic(mechanic).then(function () {
                                return res.json({ user, mechanic, token });
                            });
                        });
                } else {
                    return res.json({ user, token });
                }
            });
        })
            (req, res);

    });

    app.post('/signup', function (req, res, next) {
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
                    return res.status(422);
                }

                user.stripeCustomerID = customer.id;
                user.save().then(user => {
                    req.login(user, { session: false }, (err) => {
                        if (err) {
                            res.send(err);
                        }

                        const token = jwt.sign(user.dataValues, 'your_jwt_secret');

                        if (req.query.isMechanic == "true") {
                            stripe.accounts.create({
                                country: 'US',
                                type: 'custom',
                                tos_acceptance: {
                                    date: Math.floor(Date.now() / 1000),
                                    ip: req.connection.remoteAddress
                                },
                                legal_entity: {
                                    type: 'individual',
                                }
                            }).then(account => {
                                models.Mechanic.findOrCreate({
                                    where: {
                                        userID: user.id,
                                        stripeAccountID: account.id
                                    },
                                    defaults: { isActive: true, id: uuidV1() }
                                }).spread(function (mechanic, created) {
                                    user.setMechanic(mechanic).then(function () {
                                        return res.json({ user, mechanic, token });
                                    });
                                });
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

};





