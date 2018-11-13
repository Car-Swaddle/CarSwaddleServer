const express = require('express');

module.exports = function (router, models) {

    router.get('/nearest-mechanics', function (req, res) {
        console.log('nearest-mechanics GET');
        var query = req.query;
        var latitude = parseFloat(query.latitude);
        var longitude = parseFloat(query.longitude);
        var limit = query.limit || 10;
        limit = limit > 25 ? 25 : limit;
        const maxDistance = parseFloat(query.maxDistance) || 10000;

        models.sequelize.query('SELECT *, u.id as "userID", m.id as "id", r.id as "regionID", ST_Distance(r.origin, ST_MakePoint(?, ?), false) AS "distance" FROM "user" AS u INNER JOIN mechanic as m ON m."userID" = u.id INNER JOIN regions AS r ON m.id = r."mechanicID" AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) < r.radius AND m."isActive" = true AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) <= ? ORDER BY ST_MakePoint(?,?) <-> r.origin FETCH FIRST ? ROWS ONLY', { replacements: [longitude, latitude, longitude, latitude, longitude, latitude, maxDistance, longitude, latitude, limit], type: models.sequelize.QueryTypes.SELECT, model: models.User }).then( users => {
            return res.json(users);
        });
    });

    return router;
};
