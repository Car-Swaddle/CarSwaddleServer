const express = require('express');

module.exports = function (app, models, passport) {
    require('./auth.js')(app, models, passport);

    var api = require('./api')(app, models);
    app.use('/api', passport.authenticate('jwt', {session: false}), api)
}
