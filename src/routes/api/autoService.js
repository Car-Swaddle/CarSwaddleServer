const express = require('express');
const uuidV1 = require('uuid/v1');
const pushService = require('../../notifications/pushNotifications.js');


module.exports = function (router, models) {

    const Op = models.Sequelize.Op;

    const includeDict = [
        {
            model: models.User,
            attributes: models.User.defaultAttributes,
        },
        models.Location,
        {
            model: models.ServiceEntity,
            include: [models.OilChange]
        },
        models.Vehicle,
        {
            model: models.Mechanic,
            include: [
                {
                    model: models.User,
                    attributes: models.User.defaultAttributes,
                }
            ],
        }
    ];

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

    router.get('/auto-service', function (req, res) {
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
                return res.status(422);
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

    router.patch('/auto-service', function (req, res) {

        const autoServiceID = req.query.autoServiceID;
        const body = req.body;

        if (autoServiceID == null) {
            return res.status(422);
        }

        models.AutoService.findOne({
            where: {
                id: autoServiceID,
            }
        }).then(autoService => {

            if (autoService == null) {
                return res.status(404);
            }

            req.user.getMechanic().then(currentUserMechanic => {
                // if (currentUserMechanic == null) {
                //     return res.status(404);
                // }

                var changedByUser = false;
                var changedByMechanic = false;

                var shouldSave = false;

                if (autoService.userID == req.user.id) {
                    changedByUser = true;
                }

                if (currentUserMechanic != null && autoService.mechanicID == currentUserMechanic.id) {
                    changedByMechanic = true;
                }

                if (changedByUser == false && changedByMechanic == false) {
                    return res.status(404);
                }

                var didChangeStatus = false
                var promises = []
                if (body.status != null && models.AutoService.isValidStatus(body.status) == true && body.status != autoService.status) {
                    autoService.status = body.status
                    shouldSave = true;
                    didChangeStatus = true;
                }

                if (body.vehicleID != null && body.vehicleID != autoService.vehicleID) {
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
                                    pushService.sendUserNotification(user, alert, null, null);
                                } else {
                                    const alert = 'Your mechanic made a change to your oil change.';
                                    pushService.sendUserNotification(user, alert, null, null);
                                }
                            });
                        }

                        if (changedByUser == true) {
                            newAutoService.getMechanic().then(mechanic => {
                                const alert = req.user.displayName() + ' changed one of your scheduled auto services.';
                                pushService.sendMechanicNotification(mechanic, alert, null, null);
                            });
                        }

                        return res.json(newAutoService);
                    });
                });
            });
        });
    });


    router.post('/auto-service', function (req, res) {
        console.log('auto-service POST')

        var body = req.body;

        var status = body.status
        if (models.AutoService.isValidStatus(status) == false) {
            return res.status(422).json({ error: 'Invalid status:' + status });
        }

        const scheduledDate = body.scheduledDate;
        if (scheduledDate == null) {
            return res.status(422);
        }

        if (body.vehicleID == null) {
            return res.status(422);
        }

        const serviceEntities = body.serviceEntities;

        if (serviceEntities.length <= 0) {
            // Must have at least one service entity
            return res.status(422);
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
            return res.status(422);
        }

        if (body.mechanicID == null) {
            return res.status(422);
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
                                    // const payload = { 'someMessage': 'Here is your new fancy car!' };
                                    const displayName = req.user.displayName();
                                    const alert = displayName + ' scheduled an appointment';
                                    pushService.sendMechanicNotification(mechanic, alert);
                                    return res.json(newAutoService);
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

    return router;
};
