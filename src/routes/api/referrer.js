const express = require('express');
const constants = require('../../controllers/constants');
const bodyParser = require('body-parser');

module.exports = (router, models) => {
    
    router.get('/referrers', bodyParser.json(), async function (req, res) {
        return res.json([]);
    });

    router.get('/referrers/:referrerID', bodyParser.json(), async function (req, res) {
        // req.params.referrerID
        return res.json({});
    });

    router.post('/referrers', bodyParser.json(), async function (req, res) {
        return res.json({});
    });

    router.put('/referrers/:referrerID', bodyParser.json(), async function (req, res) {
        return res.json({});
    });

    router.delete('/referrers/:referrerID', bodyParser.json(), async function (req, res) {
        return res.json({});
    });

    router.get('/pay-structures', bodyParser.json(), async function (req, res) {
        return res.json([]);
    });

    router.get('/pay-structures/:payStructureID', bodyParser.json(), async function (req, res) {
        return res.json({});
    });

    router.post('/pay-structures', bodyParser.json(), async function (req, res) {
        return res.json({});
    });

    router.put('/pay-structures/:payStructureID', bodyParser.json(), async function (req, res) {
        return res.json({});
    });

    router.delete('/pay-structures/:payStructureID', bodyParser.json(), async function (req, res) {
        return res.json({});
    });

    return router;
};

