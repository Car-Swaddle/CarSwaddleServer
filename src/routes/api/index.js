const express = require('express');

module.exports = function (app, models) {
    const express = require('express');
    const router = express.Router();

    require('./autoService.js')(router, models);
    require('./mechanic.js')(router, models);
    require('./templateTimeSpan.js')(router, models);
    require('./autoService.js')(router, models);
    require('./user.js')(router, models);
    require('./region.js')(router, models);
    require('./mechanic.js')(router, models);
    require('./vehicle.js')(router, models);

    return router;
}

