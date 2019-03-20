const express = require('express');
const uuidV1 = require('uuid/v1');
const bodyParser = require('body-parser');

module.exports = function (router, models) {

    router.post('/region', bodyParser.json(), function (req, res) {
        console.log('region POST');

        var latitude = req.body.latitude;
        var longitude = req.body.longitude;
        var radius = req.body.radius;
        req.user.getMechanic().then(async function (mechanic) {
            const previousRegion = await mechanic.getRegion();
            if (!previousRegion) {
                await previousRegion.destroy();
            }
            var point = { type: 'Point', coordinates: [longitude, latitude] };
            const region = await models.Region.create({ id: uuidV1(), origin: point, radius: radius });

            mechanic.setRegion(region).then(region => {
                mechanic.hasSetServiceRegion = true;
                mechanic.save().then(mechanic => {
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

    router.get('/region', bodyParser.json(), function (req, res) {
        console.log('region GET');
        req.user.getMechanic().then(mechanic => {
            return mechanic.getRegion();
        }).then(region => {
            return res.json(region);
        })
    });


    return router;
};

