const express = require('express');
const uuidV1 = require('uuid/v1');

module.exports = function (router, models) {

    router.get('/current-mechanic', function (req, res) {
        req.user.getMechanic().then( mechanic => {
            return res.json(mechanic);
        });
    });

    router.get('/nearest-mechanics', function (req, res) {
        console.log('nearest-mechanics GET');
        var query = req.query;
        var latitude = parseFloat(query.latitude);
        var longitude = parseFloat(query.longitude);
        var limit = query.limit || 10;
        limit = limit > 25 ? 25 : limit;
        const maxDistance = parseFloat(query.maxDistance) || 10000;

        models.sequelize.query('SELECT *, u.id as "userID", m.id as "id", r.id as "regionID", ST_Distance(r.origin, ST_MakePoint(?, ?), false) AS "distance" FROM "user" AS u INNER JOIN mechanic as m ON m."userID" = u.id INNER JOIN region AS r ON m.id = r."mechanicID" AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) < r.radius AND m."isActive" = true AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) <= ? ORDER BY ST_MakePoint(?,?) <-> r.origin FETCH FIRST ? ROWS ONLY', {
            replacements: [longitude, latitude, longitude, latitude, longitude, latitude, maxDistance, longitude, latitude, limit],
            type: models.sequelize.QueryTypes.SELECT,
            model: models.User
        }).then(users => {
            return res.json(users);
        });
    });

    router.patch('/update-mechanic', function (req, res) {
        const body = req.body;
        var user = req.user;
        var didChangeMechanic = false;

        user.getMechanic().then(mechanic => {
            if (mechanic == null) {
                return res.status(400);
            }
            var promises = [];
            if (body.isActive != null) {
                mechanic.isActive = body.isActive
                didChangeMechanic = true
            }
            if (body.token != null) {
                didChangeMechanic = true
                var promise = models.DeviceToken.findOne({
                    where: {
                        token: body.token,
                        mechanicID: mechanic.id
                    }
                }).then(deviceToken => {
                    if (deviceToken == null) {
                        return models.DeviceToken.create({
                            id: uuidV1(),
                            token: body.token
                        }).then(deviceToken => {
                            mechanic.addDeviceToken(deviceToken);
                            return mechanic.save();
                        });
                    } else {
                        return null;
                    }
                });
                promises.push(promise);
            }
            if (didChangeMechanic == true) {
                Promise.all(promises).then(values => {
                    mechanic.save().then(savedMechanic => {
                        return res.send(savedMechanic);
                    });
                });
            } else {
                return res.send(user);
            }
        });
    });

    return router;
};
