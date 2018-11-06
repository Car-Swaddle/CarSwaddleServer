const express = require('express');

module.exports = function (router, models) {

    router.get('/mechanic', function (req, res) {
        console.log('mechanic GET');
        var query = req.query;
        var latitude = parseFloat(query.latitude);
        var longitude = parseFloat(query.longitude);
        var limit = query.limit || 10;
        const maxDistance = parseFloat(query.maxDistance) || 10000;

        models.sequelize.query('SELECT "id", "origin", "radius", "createdAt", "updatedAt", "regionID", ST_Distance("origin", ST_MakePoint(?, ?), false) AS "distance" FROM "regions" AS "region" WHERE ST_DWithin("origin", ST_MakePoint(?, ?), ?, false) = true AND ST_Distance("origin", ST_MakePoint(?, ?), false) - radius <= 0 ORDER BY distance ASC LIMIT ?;', { replacements: [latitude, longitude, latitude, longitude, maxDistance, latitude, longitude, limit], type: models.sequelize.QueryTypes.SELECT, model: models.Region }).then( regions => {
            return res.json(regions);
        });

        // const point = models.Sequelize.fn('ST_MakePoint', longitude, latitude);
        // const origin = models.Sequelize.col('origin');

        // models.Region.findAll({
        //     attributes: {
        //     include: [
        //         [
        //         models.Sequelize.fn(
        //             'ST_Distance',
        //             origin,
        //             point,
        //             false
        //         ),
        //         'distance'
        //         ]
        //     ]
        //     },
        //     where: models.Sequelize.where(
        //         models.Sequelize.fn(
        //             'ST_DWithin',
        //             origin,
        //             point,
        //             maxDistance,
        //             false
        //         ),
        //         true
        //     ), 
        //     order: models.Sequelize.literal('distance ASC'),
        //     limit: limit
        // }).then( regions => {
        //     return res.json(regions);
        // })
    });

    return router;
};
