const express = require('express');
const uuidV1 = require('uuid/v1');
const asyncMiddleware = require('../../lib/middleware/async-middleware');
const pushService = require('../../notifications/pushNotifications.js');
const bodyParser = require('body-parser');
const constants = require('../../controllers/constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const distance = require('../distance.js');
const VehicleService = require('../../controllers/vehicle').VehicleService

module.exports = function (router, models) {

    const emailFile = require('../../notifications/email.js');
    const emailer = new emailFile(models);

    const autoServiceScheduler = require('../../controllers/auto-service-scheduler.js')(models);
    const stripeChargesFile = require('../../controllers/stripe-charges.js')(models);
    const billingCalculations = require('../../controllers/billing-calculations')(models);
    const taxes = require('../../controllers/taxes')(models);
    const vehicleService = new VehicleService(models);

    const reminderFile = require('../../notifications/reminder.js');
    const reminder = new reminderFile(models);

    const Op = models.Sequelize.Op;

    router.get('/auto-service-details', bodyParser.json(), function (req, res) {
        if (!req.query.autoServiceID) {
            return res.status(422).send();
        }
        autoServiceScheduler.findAutoService(req.query.autoServiceID, function (err, autoService) {
            return res.json(autoService);
        });
    });

    router.get('/auto-service', bodyParser.json(), asyncMiddleware(async function (req, res) {
        const offset = req.query.offset || 0;
        const limit = req.query.limit || 50;
        const sortStatus = req.query.sortStatus;

        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        var mechanicID = req.query.mechanicID;
        var userID;
        if (!mechanicID) {
            userID = req.user.id
        } else {
            userID = null;
        }
        const filter = req.query.filterStatus;
        autoServiceScheduler.findAutoServices(mechanicID, userID, limit, offset, filter, sortStatus, startDate, endDate, req.query.autoServiceID, function (err, autoServices) {
            if (!err) {
                return res.json(autoServices);
            } else {
                return res.send(err);
            }
        });
    }));

    router.patch('/auto-service', bodyParser.json(), asyncMiddleware(async function (req, res) {

        const autoServiceID = req.query.autoServiceID;
        const body = req.body;

        if (autoServiceID == null) {
            return res.status(422).send('invalid parameters');
        }

        const autoService = await models.AutoService.findOne({ where: { id: autoServiceID } });
        if (autoService == null) {
            return res.status(404).send('invalid parameters');
        }

        const autoServiceUser = await models.User.findByPk(autoService.userID);
        const autoServiceMechanic = await models.Mechanic.findByPk(autoService.mechanicID);
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
            const p = vehicleService.getVehicle(body.vehicleId).then(newVehicle => {
                return autoService.setVehicle(newVehicle);
            });
            promises.push(p);
        }

        if (body.mechanicID != null && body.mechanicID != autoService.mechanicID) {
            const p = models.Mechanic.findByPk(body.mechanicID).then(queriedMechanic => {
                return autoService.setMechanic(queriedMechanic);
            });
            promises.push(p);
        }

        if (body.locationID != null && body.locationID != autoService.locationID) {
            const p = models.Location.findByPk(body.locationID).then(location => {
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
            models.AutoService.findOne({
                where: { id: autoService.id },
                include: autoServiceScheduler.includeDict(),
            }).then(newAutoService => {

                if (changedByMechanic == true) {
                    // (user, alert, payload, badge)
                    newAutoService.getUser().then(async user => {
                        // const mechanic = await newAutoService.getMechanic();
                        if (didChangeStatus) {
                            // pushService.sendUserNotification(user, alert, null, null, null);
                            pushService.sendUserMechanicChangedAutoServiceStatusNotification(user, newAutoService, body.status);
                            if (body.status == models.AutoService.STATUS.completed) {
                                pushService.sendRateMechanicNotificationToUserOf(newAutoService);

                                reminder.scheduleNPSSurvey(user.firstName, user.email);
                            }
                        } else {
                            pushService.sendUserMechanicChangedAutoServiceNotification(user, newAutoService);
                        }
                    });
                }

                if (changedByUser == true) {
                    newAutoService.getMechanic().then(mechanic => {
                        if (userDidReviewMechanic == true) {
                            pushService.sendUserReviewNotification(req.user, mechanic, reviewRating);
                        } else {
                            pushService.sendMechanicUserChangedAutoServiceNotification(req.user, mechanic, newAutoService);
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

                    Promise.all([
                        stripe.refunds.create({
                            charge: autoService.chargeID,
                        }),
                        autoService.transferID && stripe.transfers.createReversal(
                            autoService.transferID,
                            { refund_application_fee: true }
                        ),
                    ]).then(refunds => {
                        newAutoService.refundID = refunds[0] && refunds[0].id;
                        newAutoService.transferReversalID = refunds[1] && refunds[1].id;
                        newAutoService.save().then(savedAutoService => {
                            return res.json(savedAutoService);
                        });
                    }).catch(error => {
                        return res.json(newAutoService);
                    });
                } else {
                    return res.json(newAutoService);
                }
            });
        });
    }));

    router.post('/auto-service', bodyParser.json(), asyncMiddleware(async function (req, res) {
        const {
            status,
            scheduledDate,
            vehicleID,
            mechanicID,
            sourceID,
            serviceEntities,
            location: address,
            locationID,
            notes,
            couponID,
        } = req.body;

        const oilChangeService = serviceEntities.find(x => x.entityType === 'OIL_CHANGE');
        const oilType = oilChangeService && oilChangeService.specificService.oilType;

        const [
            location,
            mechanic,
            coupon,
            inTimeSlot,
            isAlreadyScheduled,
        ] = await Promise.all([
            models.Location.findBySearch(locationID, address),
            models.Mechanic.findByPk(mechanicID),
            models.Coupon.redeem(couponID, mechanicID),
            autoServiceScheduler.isDateInMechanicSlot(scheduledDate, req.user, mechanicID),
            autoServiceScheduler.isDatePreviouslyScheduled(scheduledDate, req.user, mechanicID)
        ]);

        if (autoServiceScheduler.isValidScheduledDate(scheduledDate, req.user) == false || inTimeSlot == false || isAlreadyScheduled == true) {
            models.Coupon.undoRedeem(coupon);

            return res.status(422).send({ code: 'MECHANIC_TIME_ALREADY_RESERVED' });
        }

        if(couponID && !coupon) {
            return res.status(422).send({ code: 'COUPON_NOT_FOUND' });
        }

        if (location == null || mechanic == null) {
            models.Coupon.undoRedeem(coupon);

            return res.status(422).send();
        }

        const taxRate = await taxes.taxRateForLocation(location);
        const prices = await billingCalculations.calculatePrices(mechanic, location, oilType, vehicleID, coupon, taxRate);

        const invoice = await stripeChargesFile.updateDraft(req.user.stripeCustomerID, prices, {
            transferAmount: prices.transferAmount,
            mechanicCost: prices.mechanicCost,
            mechanicID,
            oilType,
        }, taxRate);

        autoServiceScheduler.scheduleAutoService(req.user, status, scheduledDate, vehicleID, mechanicID, invoice.id, sourceID, prices.transferAmount, serviceEntities, address, locationID, couponID, notes, function (err, autoService) {
            if (!err) {
                return res.json(autoService);
            } else {
                models.Coupon.undoRedeem(coupon);

                return res.status(400).send(err);
            }
        });
    }));

    router.post('/email/auto-service', bodyParser.json(), function (req, res) {
        models.AutoService.findOne({
            where: { userID: req.user.id }
        }).then(autoservice => {
            if (!autoservice) {
                res.status(500).send('no auto service');
                return;
            }
            emailer.sendUserOilChangeReminderMail(autoservice, function (err) {
                if (err) {
                    res.status(500).send('unable to send email' + err);
                } else {
                    res.status(400).send('successfully sent email');
                }
            });
        }).catch(err => {
            res.status(500).send('unable to send email' + err);
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
