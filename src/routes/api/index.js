const express = require('express');

module.exports = function (app, models) {
    const express = require('express');
    const router = express.Router();

    require('./autoService.js')(router, models);
    require('./user.js')(router, models);

    return router;
}

