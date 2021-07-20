const calendar = require('./api/calendar')
const rateLimit = require('express-rate-limit');

module.exports = function (app, models, passport) {
    require('./auth.js')(app, models, passport);
    require('./stripe-webhook.js')(app, models);
    require('./email.js')(app, models);

    const apiLimiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 15 minute window
        max: 100, // start blocking after 200 requests
    });

    var api = require('./api')(app, models);
    app.use('/api/calendar', calendar)
    app.use('/api', apiLimiter, passport.authenticate('jwt', {session: false}), api)
}
