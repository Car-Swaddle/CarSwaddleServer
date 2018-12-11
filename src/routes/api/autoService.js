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
            whereDict.autoServiceID = autoServiceID
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

        if (body.status == null) {
            return res.status(422).json({ error: 'Invalid status:' + status });
        }

        if (models.AutoService.isValidStatus(body.status) == false) {
            return res.status(422).json({ error: 'Invalid status: ' + body.status });
        }


        models.AutoService.findOne({
            where: {
                userID: req.user.id,
                id: autoServiceID,
            }
        }).then(autoService => {

            if (autoService == null) {
                return res.status(404);
            }

            var promises = []
            if (body.status != null) {
                autoService.status = body.status
                const p = autoService.save();
                promises.push(p);
            }

            if (body.vehicleID != null) {
                const p = models.Vehicle.findById(body.vehicleID).then(vehicle => {
                    return autoService.setVehicle(vehicle)
                });
                promises.push(p);
            }

            if (body.mechanicID != null) {
                const p = models.Vehicle.findById(body.mechanicID).then(mechanic => {
                    return autoService.setMechanic(mechanic)
                });
                promises.push(p);
            }

            if (body.locationID != null) {
                const p = models.Location.findById(body.locationID).then(location => {
                    return autoService.setLocation(location)
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
                    return autoService.setLocation(location)
                })
                promises.push(p);
            }

            if (body.scheduledDate != null) {
                autoService.scheduledDate = body.scheduledDate
                const p = autoService.save();
                promises.push(p);
            }

            Promise.all(promises).then(values => {
                models.AutoService.find({
                    where:
                        { id: autoService.id },
                    include: [models.Location,
                    {
                        model: models.ServiceEntity,
                        include: [models.OilChange]
                    }, models.Vehicle],
                }).then(newAutoService => {
                    return res.json(newAutoService);
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
                        autoService.setMechanic(mechanic);
                        autoService.setUser(req.user);
                        autoService.setVehicle(vehicle);
                        autoService.setLocation(location);
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
                                models.AutoService.find({
                                    where:
                                        { id: autoService.id },
                                    include: [models.Location,
                                    {
                                        model: models.ServiceEntity,
                                        include: [models.OilChange]
                                    }, models.Vehicle],
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
