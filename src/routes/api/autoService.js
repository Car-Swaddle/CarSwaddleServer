const express = require('express');
const uuidV1 = require('uuid/v1');

module.exports = function (router, models) {

    const Op = models.Sequelize.Op;

    router.get('/auto-service', function (req, res) {
        if (req.query.autoServiceID != null) {
            models.AutoService.findById(req.query.autoServiceID).then( autoService => {
                return res.json(autoService);
            });
        } else if (req.query.startDate != null && req.query.endDate != null && req.query.mechanicID != null) {
            var status = req.query.status;
            models.AutoService.findAll({
                where: {
                    scheduledDate: {
                        "$between": [req.query.startDate,req.query.endDate]
                    },
                    mechanicID: req.query.mechanicID,
                    status: {
                        [Op.or]: status,
                      }
                }
            }).then( autoServices => {
                return res.json(autoServices);
            });
        }
    });

    router.get('/auto-service', function (req, res) {
        models.AutoService.findById(req.query.autoServiceID).then( autoService => {
            return res.json(autoService);
        });
    });

    router.post('/auto-service', function (req, res) {
        console.log('auto-service POST');

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

        locationPromise.then( location => {
            req.user.getMechanic().then( mechanic => {
                models.Vehicle.findById(body.vehicleID).then( vehicle => {
                    models.AutoService.create({
                        id: uuidV1(),
                        status: status,
                        notes: body.notes,
                        scheduledDate: scheduledDate,
                    }).then( autoService => {
                        autoService.setMechanic(mechanic);
                        autoService.setUser(req.user);
                        autoService.setVehicle(vehicle);
                        autoService.setLocation(location);
                        autoService.save().then( updatedAutoService => {
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
                            for(i = 0; i < keys.length; i++) {
                                const key = keys[i];
                                var specificServices = entityTypeToSpecificEntities[key];
                                for(j = 0; j < specificServices.length; j++) {
                                    if (key == 'OIL_CHANGE') {
                                        const specificService = specificServices[j];
                                        const p = models.OilChange.create({
                                            id: uuidV1(),
                                            oilType: specificService.oilType
                                        }).then( oilChange => {
                                            return models.ServiceEntity.create({
                                                id: uuidV1(),
                                                entityType: key,
                                                autoService: updatedAutoService,
                                                oilChange: oilChange
                                            }).then( serviceEntity => {
                                                serviceEntity.setOilChange(oilChange);
                                                serviceEntity.setAutoService(updatedAutoService);
                                                return serviceEntity.save();
                                            });
                                        });
                                        serviceEntityPromises.push(p);
                                    }
                                }
                            }
            
                            Promise.all(serviceEntityPromises).then( values => {
                                models.AutoService.find({where:
                                    { id: autoService.id },
                                    include: [models.Location, 
                                        {
                                            model: models.ServiceEntity,
                                            include: [models.OilChange]
                                        }, models.Vehicle],
                                }).then( newAutoService => {
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
