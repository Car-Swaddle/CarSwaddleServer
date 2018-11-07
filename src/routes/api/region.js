const express = require('express');
const uuidV1 = require('uuid/v1');

module.exports = function (router, models) {

    router.post('/region', function (req, res) {
        console.log('region POST');

        var latitude = req.body.latitude;
        var longitude = req.body.longitude;
        var radius = req.body.radius;
        req.user.getMechanic().then( function(mechanic) {
            mechanic.getRegion().then( previousRegion => {
                if (previousRegion == null) {
                    return;
                } else {
                    return previousRegion.destroy();
                }
            }).then(() => {
                var point = { type: 'Point', coordinates: [longitude,latitude] };
                return models.Region.create({ id: uuidV1(), origin: point, radius: radius });
            }).then( region => {
                mechanic.setRegion(region).then( region => {
                    models.Mechanic.find({ 
                        where: {
                            id: mechanic.id
                        },
                        include: [{
                            model: models.Region, required: true
                        }]
                    }).then(fetchedMechanic => {
                        return res.json(fetchedMechanic);
                    });
                });
            });
        });
    });

    router.get('/region', function (req, res) {
        console.log('region GET');
        req.user.getMechanic().then( mechanic => {
            return mechanic.getRegion();
        }).then( region => {
            return res.json(region);
        })
    });


    return router;
};

