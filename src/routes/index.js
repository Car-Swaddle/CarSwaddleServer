
module.exports = function (app, models, passport) {
    require('./auth.js')(app, models, passport);
    require('./stripe-webhook.js')(app, models);
    require('./email.js')(app, models);

    var api = require('./api')(app, models);
    app.use('/api', passport.authenticate('jwt', {session: false}), api)
}
