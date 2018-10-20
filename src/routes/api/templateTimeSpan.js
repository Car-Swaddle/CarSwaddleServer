const express = require('express');

module.exports = function (router, models) {

    router.post('/availability', function (req, res) {
        console.log('templateTimeSpan POST');

        var body = req.body;

        var status = body.status
        if (models.AutoService.isValidStatus(status) == false) {
            res.status(422).json({ error: 'Invalid status:' + status })
        }

        var type = body.type
        if (models.AutoService.isValidType(type) == false) {
            res.status(422).json({ error: 'Invalid type:' + type })
        }
        
    });

    return router;
};
