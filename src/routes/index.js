const calendar = require('./api/calendar')
const rateLimit = require('express-rate-limit');

module.exports = function (app, models, passport) {
    require('./auth.js')(app, models, passport);
    require('./stripe-webhook.js')(app, models);
    require('./email.js')(app, models);

    var { router } = require('./api');
    const apiLimiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minute window
        max: 100, // start blocking after 100 requests
    });

    app.use('/api/calendar', calendar)
    app.use('/api', apiLimiter, passport.authenticate('jwt', {session: false}), router)
}
