const express = require('express');
const constants = require('../constants');
const bodyParser = require('body-parser');

module.exports = function (router, models) {

    require('../stats.js')(models);

    router.get('/average-rating-received', bodyParser.json(), function (req, res) {
        var id = null;
        if (req.query.mechanic != null) {
            id = req.query.mechanic;
        } else if (req.query.user != null) {
            id = req.query.user;
        } else {
            id = req.user.id;
        }
        averageReceivedRating(id).then(averageRating => {
            if (averageRating[0] == null) {
                return res.status(404).send();
            }
            return res.json(averageRating[0]);
        });
    });

    router.get('/ratings-count', bodyParser.json(), function (req, res) {
        var id = null;
        if (req.query.mechanic != null) {
            id = req.query.mechanic;
        } else if (req.query.user != null) {
            id = req.query.user;
        } else {
            id = req.user.id;
        }
        numberOfRatingsReceived(id).then(count => {
            if (count[0] == null) {
                return res.status(404).send();
            }
            return res.json(count[0]);
        });
    });

    router.get('/reviews', bodyParser.json(), function (req, res) {
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

    const includeArray = [
        { model: models.AutoService, as: 'autoServiceFromUser' },
        { model: models.AutoService, as: 'autoServiceFromMechanic' }
    ];

    return router;
};