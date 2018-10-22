const express = require('express');

module.exports = function (router, models) {

    router.post('/mechanic', function (req, res) {
        console.log('mechanic POST');

        var body = req.body;
    });

    return router;
};
