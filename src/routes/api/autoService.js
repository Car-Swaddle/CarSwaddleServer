const express = require('express');
const uuidV1 = require('uuid/v1');
const pushService = require('../../notifications/pushNotifications.js');
const bodyParser = require('body-parser');

module.exports = function (router, models) {

    require('../../stripe-methods/stripe-charge.js')(models);

    const Op = models.Sequelize.Op;

    const includeDict = [
        { model: models.User, attributes: models.User.defaultAttributes, },
        models.Location,
        { model: models.ServiceEntity, include: [models.OilChange] },
        models.Vehicle,
        {
            model: models.Mechanic,
            include: [
                {
                    model: models.User,
                    attributes: models.User.defaultAttributes,
                }
            ],
        },
        reviewIncludeDict('reviewFromUser'),
        reviewIncludeDict('reviewFromMechanic'),
    ];

    function reviewIncludeDict(as) {
        return {
            model: models.Review,
            attributes: ['id', 'rating', 'text', 'reviewerID', 'revieweeID'],
            as: as,
            include: [
                { model: models.User, attributes: ['id'] },
                { model: models.Mechanic, attributes: ['id'] }
            ],
        }
    }

    function autoServiceWhereDict(mechanicID, userID, status, startDate, endDate, autoServiceID) {
        var whereDict = {
        }

        if (startDate != null && endDate != null) {
            whereDict.scheduledDate = {
                "$between": [startDate, endDate]
            };
        }
        if (mechanicID != null) {
            whereDict.mechanicID = mechanicID;
        }
        if (userID != null) {
            whereDict.userID = userID;
        }
        if (status != null) {
            whereDict.status = {
                [Op.or]: status
            }
        }

        if (autoServiceID != null) {
            whereDict.id = autoServiceID
        }

        return whereDict;
    }

    router.get('/auto-service', bodyParser.json(), function (req, res) {
        const offset = req.query.offset || 0;
        const limit = req.query.limit || 50;
        var sortStatus = req.query.sortStatus || []; // || models.AutoService.allStatus;

        if (Array.isArray(sortStatus) == false && sortStatus != null) {
            sortStatus = [sortStatus];
        }

        var userID;
        if (req.query.mechanicID == null) {
            userID = req.user.id;
        }

        var mechanicID = req.query.mechanicID;

        var order;
        if (sortStatus == null && sortStatus.length != 0) {
            if (models.AutoService.areValidStatuses(sortStatus) == false) {
                return res.status(422).send();
            }
            var queryString = models.AutoService.rawStatusQueryString(sortStatus);
            order = [[models.sequelize.literal(queryString)], ['scheduledDate', 'DESC']]
        } else {
            order = [['scheduledDate', 'DESC']];
        }

        models.AutoService.findAll({
            where: autoServiceWhereDict(mechanicID, userID, req.query.filterStatus, req.query.startDate, req.query.endDate, req.query.autoServiceID),
            order: order,
            limit: limit,
            offset: offset,
            include: includeDict,
        }).then(autoServices => {
            return res.json(autoServices);
        })
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
        if (body.status != null && models.AutoService.isValidStatus(body.status) == true && body.status != autoService.status) {
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

        if (body.locationID != null && body.locationID != autoService.locationID && autoServiceUser.id == req.user.id) {
            const p = models.Location.findById(body.locationID).then(location => {
                return autoService.setLocation(location);
            });
            promises.push(p);
        }

        if (body.location != null && body.location.longitude != null && body.location.latitude != null && autoServiceUser.id == req.user.id) {
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

        if (body.scheduledDate != null && body.scheduledDate != autoService.scheduledDate && autoServiceUser.id == req.user.id) {
            autoService.scheduledDate = body.scheduledDate;
            shouldSave = true;
        }

        if (body.notes != null && body.notes != autoService.notes && autoServiceUser.id == req.user.id) {
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
                include: includeDict,
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

                return res.json(newAutoService);
            });
        });
    });


    router.post('/auto-service', bodyParser.json(), async function (req, res) {
        console.log('auto-service POST')

        var body = req.body;

        var status = body.status;
        if (models.AutoService.isValidStatus(status) == false) {
            return res.status(422).json({ error: 'Invalid status:' + status });
        }

        const priceID = body.priceID;
        if (priceID == null) {
            return res.status(422).send('invalid parameters');
        }
        const price = await models.Price.findById(priceID);
        if (price == null) {
            return res.status(422).send('invalid parameters');
        }

        const scheduledDate = body.scheduledDate;
        if (scheduledDate == null) {
            return res.status(422).send();
        }

        if (body.vehicleID == null) {
            return res.status(422).send();
        }

        const sourceID = req.body.sourceID;
        if (sourceID == null) {
            return res.status(422).send('invalid parameters');
        }

        const serviceEntities = body.serviceEntities;

        if (serviceEntities.length <= 0) {
            // Must have at least one service entity
            return res.status(422).send();
        }

        var locationPromise = null;

        const location = body.location;
        if (body.locationID != null) {
            locationPromise = models.Location.findById(body.locationID);
        } else if (location != null && location.latitude != null && location.longitude != null) {
            var point = { type: 'Point', coordinates: [body.location.longitude, body.location.latitude] };
            locationPromise = models.Location.create({
                point: point,
                streetAddress: body.location.streetAddress,
                id: uuidV1(),
            })
        } else {
            return res.status(422).send();
        }

        if (body.mechanicID == null) {
            return res.status(422).send();
        }

        locationPromise.then(location => {
            models.Mechanic.findById(body.mechanicID).then(mechanic => {
                models.Vehicle.findById(body.vehicleID).then(vehicle => {
                    models.AutoService.create({
                        id: uuidV1(),
                        status: status,
                        notes: body.notes,
                        scheduledDate: scheduledDate,
                    }).then(autoService => {
                        autoService.setMechanic(mechanic, { save: false });
                        autoService.setUser(req.user, { save: false });
                        autoService.setVehicle(vehicle, { save: false });
                        autoService.setLocation(location, { save: false });
                        autoService.setPrice(price, { save: false });
                        autoService.save().then(updatedAutoService => {
                            var entityTypeToSpecificEntities = {};

                            for (i = 0; i < serviceEntities.length; i++) {
                                var val = serviceEntities[i];
                                const entityType = val.entityType;
                                if (entityTypeToSpecificEntities[entityType] == null) {
                                    entityTypeToSpecificEntities[entityType] = []
                                }
                                entityTypeToSpecificEntities[entityType].push(val.specificService);
                            }

                            var serviceEntityPromises = [];
                            var keys = Object.keys(entityTypeToSpecificEntities)
                            for (i = 0; i < keys.length; i++) {
                                const key = keys[i];
                                var specificServices = entityTypeToSpecificEntities[key];
                                for (j = 0; j < specificServices.length; j++) {
                                    if (key == 'OIL_CHANGE') {
                                        const specificService = specificServices[j];
                                        const p = models.OilChange.create({
                                            id: uuidV1(),
                                            oilType: specificService.oilType
                                        }).then(oilChange => {
                                            return models.ServiceEntity.create({
                                                id: uuidV1(),
                                                entityType: key,
                                                autoService: updatedAutoService,
                                                oilChange: oilChange
                                            }).then(serviceEntity => {
                                                serviceEntity.setOilChange(oilChange);
                                                serviceEntity.setAutoService(updatedAutoService);
                                                return serviceEntity.save();
                                            });
                                        });
                                        serviceEntityPromises.push(p);
                                    }
                                }
                            }

                            Promise.all(serviceEntityPromises).then(values => {
                                models.AutoService.findOne({
                                    where: { id: autoService.id },
                                    include: includeDict,
                                }).then(newAutoService => {
                                    const displayName = req.user.displayName();
                                    const alert = displayName + ' scheduled an appointment';
                                    pushService.sendMechanicNotification(mechanic, alert, null, null, null);
                                    // return res.json(newAutoService);
                                    createCharge(sourceID, autoService.id, req.user).then(charge => {
                                        return res.json(newAutoService);
                                    }).catch(error => {
                                        return res.status(400).send('something went wrong');
                                    });
                                });
                            });
                        }).catch((error) => {
                            // Delete created Location
                        });
                    });
                })
            });
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


// module.exports = function () {
//     function numberOfAutoServicesProvided(id)  {
//         return models.sequelize.query('SELECT COUNT(object) as count FROM (SELECT FROM "autoService" as r WHERE "mechanicID" = ? AND "status" = "completed") as object', {
//             replacements: [id],
//             type: models.sequelize.QueryTypes.SELECT
//         });
//     }
// };
