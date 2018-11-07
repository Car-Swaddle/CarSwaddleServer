const express = require('express');

module.exports = function (router, models) {

    router.get('/mechanic', function (req, res) {
        console.log('mechanic GET');
        var query = req.query;
        var latitude = parseFloat(query.latitude);
        var longitude = parseFloat(query.longitude);
        var limit = query.limit || 10;
        const maxDistance = parseFloat(query.maxDistance) || 10000;

        models.sequelize.query('SELECT *, ST_Distance(r.origin, ST_MakePoint(?, ?), false) AS "distance" FROM mechanic AS m INNER JOIN regions AS r ON m.id = r."regionID" AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) < r.radius AND m."isActive" = true AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) <= ? ORDER BY ST_MakePoint(?,?) <-> r.origin FETCH FIRST ? ROWS ONLY', { replacements: [longitude, latitude, longitude, latitude, longitude, latitude, maxDistance, longitude, latitude, limit], type: models.sequelize.QueryTypes.SELECT, model: models.Region }).then( mechanics => {
            return res.json(mechanics);
        });
    });

    return router;
};
