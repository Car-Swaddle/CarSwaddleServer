const express = require('express');

module.exports = function (router, models) {

    router.post('/auto-service', function (req, res) {
        console.log('auto-service POST');

        var body = req.body;

        var status = body.status
        if (models.AutoService.isValidStatus(status) == false) {
            res.status(422).json({ error: 'Invalid status:' + status })
        }

        var type = body.type
        if (models.AutoService.isValidType(type) == false) {
            res.status(422).json({ error: 'Invalid type:' + type })
        }

        // var user = models.User.findById
        // var mechanic = models.User.findByPrimary


        var point = { type: 'Point', coordinates: [body.location.longitude, body.location.latitude] };
        models.Location.create({
            point: point,
            streetAddress: body.location.streetAddress,
            id: uuidV1(),
        }).then((location) => {
            models.AutoService.create({
                id: uuidV1(),
                type: type,
                status: status,
                notes: body.notes,
                scheduledDate: body.date,
                location: location,
            }).then((autoService) => {
                var json = JSON.stringify({
                    'autoService': autoService.toJSON(),
                });
                res.json(json);
            }).catch((error) => {
                // Delete created Location
            });
        });
    });

    return router;
};
