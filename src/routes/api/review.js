const express = require('express');
const constants = require('../constants');

module.exports = function (router, models) {

    router.get('/ratings-received', function (req, res) {
        if (req.query.mechanic != null) {
            averageMechanicReceivedRating(req.query.mechanic).then(averageRating => {
                if (averageRating[0] == null) {
                    return res.status(404).send();
                }
                return res.json(averageRating[0]);
            });
        } else if (req.query.user != null) {
            averageUserReceivedRating(req.query.user).then(averageRating => {
                if (averageRating[0] == null) {
                    return res.status(404).send();
                }
                return res.json(averageRating[0]);
            });
        } else {
            averageUserReceivedRating(req.user.id).then(averageRating => {
                if (averageRating[0] == null) {
                    return res.status(404).send();
                }
                return res.json(averageRating[0]);
            });
        }
    });

    router.get('/reviews', function (req, res) {
        if (req.query.mechanic != null) {
            listReviewsGivenToMechanic(req, res, req.query.mechanic);
        } else {
            listReviewsGivenByCurrentUser(req, res);
        }
    });

    function listReviewsGivenByCurrentUser(req, res) {
        models.Review.findAll({
            where: {
                reviewerID: req.user.id
            },
            include: includeArray,
            offset: req.query.offset || 0,
            limit: Math.min(req.query.limit || 100, 100),
        }).then(reviews => {
            return res.json({ reviewsGivenByCurrentUser: reviews });
        });
    }

    function listReviewsGivenToMechanic(req, res, mechanicID) {
        models.Review.findAll({
            where: {
                revieweeID: mechanicID
            },
            include: includeArray,
            offset: req.query.offset || 0,
            limit: Math.min(req.query.limit || 100, 100),
        }).then(reviews => {
            return res.json({ reviewsGivenToMechanic: reviews });
        });
    }

    function averageUserReceivedRating(userID) {
        return models.sequelize.query('SELECT AVG(object.rating) as rating FROM (SELECT r.rating as rating FROM review as r WHERE "revieweeID" = ?) as object', {
            replacements: [userID],
            type: models.sequelize.QueryTypes.SELECT
        });
    }

    function averageMechanicReceivedRating(mechanicID) {
        return models.sequelize.query('SELECT AVG(object.rating) as rating FROM (SELECT r.rating as rating FROM review as r WHERE "revieweeID" = ?) as object', {
            replacements: [mechanicID],
            type: models.sequelize.QueryTypes.SELECT
        });
    }

    const includeArray = [
        { model: models.AutoService, as: 'autoServiceFromUser' },
        { model: models.AutoService, as: 'autoServiceFromMechanic' }
    ];

    return router;
};