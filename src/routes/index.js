const calendar = require('./api/calendar')

module.exports = function (app, models, passport) {
    require('./auth.js')(app, models, passport);
    require('./stripe-webhook.js')(app, models);
    require('./email.js')(app, models);

    var { router } = require('./api');
    app.use('/api/calendar', calendar)
    app.use('/api', passport.authenticate('jwt', {session: false}), router)
}
