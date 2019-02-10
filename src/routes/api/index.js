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
    require('./price.js')(router, models);
    require('./stripe.js')(router, models);
    require('./review.js')(router, models);
    require('./logout.js')(router, models);
    require('./email-verification.js')(router, models);
    require('./sms.js')(router, models);
    require('./taxes.js')(router, models);

    return router;
}

