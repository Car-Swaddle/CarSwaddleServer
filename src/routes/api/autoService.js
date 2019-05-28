const express = require('express');
const uuidV1 = require('uuid/v1');
const pushService = require('../../notifications/pushNotifications.js');
const bodyParser = require('body-parser');
const constants = require('../../controllers/constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const distance = require('../distance.js');
const stripeChargesFile = require('../../controllers/stripe-charges.js');
const autoServiceSchedulerFile = require('../../controllers/auto-service-scheduler.js');

module.exports = function (router, models) {

    const emailFile = require('../../notifications/email.js');
    const emailer = new emailFile(models);

    // require('../../stripe-methods/stripe-charge.js')(models);
    const stripeCharges = stripeChargesFile(models);

    const reminderFile = require('../../notifications/reminder.js');
    const reminder = new reminderFile(models);
    const autoServiceScheduler = new autoServiceSchedulerFile(models);

    const Op = models.Sequelize.Op;

    router.get('/auto-service-details', bodyParser.json(), function (req, res) {
        if (!req.query.autoServiceID) {
            return res.status(422).send();
        }
        autoServiceScheduler.findAutoService(req.query.autoServiceID, function (err, autoService) {
            return res.json(autoService);
        });
    });

    router.get('/auto-service', bodyParser.json(), function (req, res) {
        const offset = req.query.offset || 0;
        const limit = req.query.limit || 50;
        const sortStatus = req.query.sortStatus;

        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        var mechanicID = req.query.mechanicID;
        const filter = req.query.filterStatus;
        autoServiceScheduler.findAutoServices(mechanicID, req.query.userID, limit, offset, filter, sortStatus, startDate, endDate, req.query.autoServiceID, function (err, autoServices) {
            if (!err) {
                return res.json(autoServices);
            } else {
                return res.send(err);
            }
        });
    });

    router.patch('/auto-service', bodyParser.json(), async function (req, res) {

        const autoServiceID = req.query.autoServiceID;
        const body = req.body;

        if (autoServiceID == null) {
            return res.status(422).send('invalid parameters');
        }

        const autoService = await models.AutoService.findOne({ where: { id: autoServiceID } });
        if (autoService == null) {
            return res.status(404).send('invalid parameters');
        }

        const autoServiceUser = await models.User.findById(autoService.userID);
        const autoServiceMechanic = await models.Mechanic.findById(autoService.mechanicID);
        const currentMechanic = await req.user.getMechanic();

        if (autoServiceUser == null || autoServiceMechanic == null) {
            return res.status(404).send('invalid auto service state');
        }

        if (autoServiceUser.id != req.user.id && autoServiceMechanic.id != currentMechanic.id) {
            return res.status(404).send('Unauthorized access to auto service');
        }

        var changedByUser = false;
        var changedByMechanic = false;

        var shouldSave = false;

        if (autoService.userID == req.user.id) {
            changedByUser = true;
        }

        if (currentMechanic != null && currentMechanic.id == autoServiceMechanic.id) {
            changedByMechanic = true;
        }

        if (changedByUser == false && changedByMechanic == false) {
            return res.status(404).send();
        }

        var didChangeStatus = false
        var promises = []
        if (body.status != null &&
            models.AutoService.isValidStatus(body.status) == true &&
            body.status != autoService.status &&
            models.AutoService.allStatus.indexOf(autoService.status) < models.AutoService.allStatus.indexOf(body.status)) {
            autoService.status = body.status
            shouldSave = true;
            didChangeStatus = true;
        }

        if (body.vehicleID != null && body.vehicleID != autoService.vehicleID && autoServiceUser.id == req.user.id) {
            const p = models.Vehicle.findOne({
                where: {
                    userID: req.user.id,
                    id: body.vehicleID,
                }
            }).then(newVehicle => {
                return autoService.setVehicle(newVehicle);
            });
            promises.push(p);
        }

        if (body.mechanicID != null && body.mechanicID != autoService.mechanicID) {
            const p = models.Mechanic.findById(body.mechanicID).then(queriedMechanic => {
                return autoService.setMechanic(queriedMechanic);
            });
            promises.push(p);
        }

        if (body.locationID != null && body.locationID != autoService.locationID) {
            const p = models.Location.findById(body.locationID).then(location => {
                return autoService.setLocation(location);
            });
            promises.push(p);
        }

        if (body.location != null && body.location.longitude != null && body.location.latitude != null) {
            var point = { type: 'Point', coordinates: [body.location.longitude, body.location.latitude] };
            const p = models.Location.create({
                point: point,
                streetAddress: body.location.streetAddress,
                id: uuidV1(),
            }).then(location => {
                return autoService.setLocation(location);
            })
            promises.push(p);
        }

        if (body.scheduledDate != null && body.scheduledDate != autoService.scheduledDate) {
            autoService.scheduledDate = body.scheduledDate;
            shouldSave = true;
        }

        if (body.notes != null && body.notes != autoService.notes) {
            autoService.notes = body.notes;
            shouldSave = true;
        }

        var userDidReviewMechanic = false;

        var reviewRating = 0;
        if (body.review != null && body.review.rating != null && body.review.text != null) {
            console.log('got review');
            const rating = body.review.rating;
            const text = body.review.text;

            var autoServicePromise = null;
            if (changedByUser) {
                userDidReviewMechanic = true;
                autoServicePromise = autoService.getReviewFromUser();
            } else {
                autoServicePromise = autoService.getReviewFromMechanic();
            }

            const promise = autoServicePromise.then(async review => {
                if (review == null) {
                    review = await models.Review.create({ id: uuidV1(), rating: rating, text: text });
                }
                review.rating = rating;
                review.text = text
                review.setMechanic(autoServiceMechanic, { save: false });
                review.setUser(autoServiceUser, { save: false });

                if (changedByUser == true) {
                    review.reviewerID = autoServiceUser.id;
                    review.revieweeID = autoServiceMechanic.id;
                    review.setAutoServiceFromUser(autoService, { save: false });
                }
                if (changedByMechanic == true) {
                    review.reviewerID = autoServiceMechanic.id;
                    review.revieweeID = autoServiceUser.id;
                    review.setAutoServiceFromMechanic(autoService, { save: false });
                }
                console.log('that review ' + review);
                reviewRating = rating;

                return review.save();
            });
            promises.push(promise);
        }

        if (shouldSave == true) {
            const p = autoService.save();
            promises.push(p);
        }

        Promise.all(promises).then(values => {
            models.AutoService.find({
                where: { id: autoService.id },
                include: autoServiceScheduler.includeDict(),
            }).then(newAutoService => {

                if (changedByMechanic == true) {
                    // (user, alert, payload, badge)
                    newAutoService.getUser().then(user => {
                        if (didChangeStatus) {
                            const alert = 'Your mechanic changed the status of your oil change to ' + body.status + '.';
                            pushService.sendUserNotification(user, alert, null, null, null);
                        } else {
                            const alert = 'Your mechanic made a change to your oil change.';
                            pushService.sendUserNotification(user, alert, null, null, null);
                        }
                    });
                }

                if (changedByUser == true) {
                    newAutoService.getMechanic().then(mechanic => {
                        if (userDidReviewMechanic == true) {
                            const name = req.user.displayName();
                            var alert = '';
                            if (reviewRating > 3) {
                                alert = name + ' gave you a ' + reviewRating + '️️⭐ review! Congratulations!';
                            } else {
                                alert = name + ' gave you a review!';
                            }
                            const title = 'New review from ' + name;

                            pushService.sendMechanicNotification(mechanic, alert, null, null, title);
                        } else {
                            const alert = req.user.displayName() + ' changed one of your scheduled auto services.';
                            pushService.sendMechanicNotification(mechanic, alert, null, null, null);
                        }
                    });
                }

                var dayOffset = (24 * 60 * 60 * 1000);
                var dayBeforeDate = new Date();
                dayBeforeDate.setTime(autoService.scheduledDate.getTime() - dayOffset);

                if (didChangeStatus == true &&
                    autoService.status == models.AutoService.STATUS.canceled &&
                    newAutoService.chargeID != null &&
                    (changedByMechanic || (changedByUser && new Date() < dayBeforeDate))) {
                    newAutoService.getPrice().then(price => {
                        if (price.totalPrice) {
                            stripe.refunds.create({
                                charge: autoService.chargeID,
                                amount: price.totalPrice,
                                reverse_transfer: true,
                            }).then(refund => {
                                if (refund) {
                                    newAutoService.refundID = refund.id;
                                    newAutoService.save().then(savedAutoService => {
                                        return res.json(savedAutoService);
                                    });
                                } else {
                                    return res.json(newAutoService);
                                }
                            }).catch(error => {
                                return res.json(newAutoService);
                            });
                        } else {
                            return res.json(newAutoService);
                        }
                    }).catch(error => {
                        return res.json(newAutoService);
                    });
                } else {
                    return res.json(newAutoService);
                }
            });
        });
    });


    router.post('/auto-service', bodyParser.json(), async function (req, res) {
        const b = req.body;
        autoServiceScheduler.scheduleAutoService(req.user, b.status, b.priceID, b.scheduledDate, b.vehicleID, b.mechanicID, b.sourceID, b.serviceEntities, b.location, b.locationId, b.notes, function (err, autoService) {
            if (!err) {
                return res.json(autoService);
            } else {
                return res.status(400).send(err);
            }
        });
    });

    router.post('/email/auto-service', bodyParser.json(), function (req, res) {
        models.AutoService.findOne({
            where: { userID: req.user.id }
        }).then(autoservice => {
            if (!autoservice) {
                return;
            }
            emailer.sendUserOilChangeReminderMail(autoservice);
        });
    });

    function numberOfAutoServicesProvided(id) {
        return models.sequelize.query('SELECT COUNT(object) as count FROM (SELECT FROM "autoService" as r WHERE "mechanicID" = ? AND "status" = "completed") as object', {
            replacements: [id],
            type: models.sequelize.QueryTypes.SELECT
        });
    }

    return router;
};
