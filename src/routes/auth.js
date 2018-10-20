const jwt = require('jsonwebtoken');


module.exports = function (app, models, passport) {
    
    app.post('/login', function (req, res, next) {
        passport.authenticate('local-login', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(400).json({
                    message: info ? info.message : 'Login failed',
                    user: user
                });
            }
            req.login(user, { session: false }, (err) => {
                if (err) {
                    res.send(err);
                }

                const token = jwt.sign(user.dataValues, 'your_jwt_secret');

                if (req.isMechanic == true) {
                    Mechanic.findOrCreate({ where: { user: user }, defaults: { isActive: true }})
                    .spread( function(mechanic, created) {
                        return res.json({user, mechanic, token })
                    })
                } else {
                    return res.json({ user, token });
                }   
            });
        })
            (req, res);

    });

    app.post('/signup', function (req, res, next) {
        console.log('sign up in auth.js first');
        passport.authenticate('local-signup', { session: false }, (err, user, info) => {
            console.log('sign up after auth');
            if (err || !user) {
                return res.status(400).json({
                    message: info ? info.message : 'Sign up failed',
                    user: user
                });
            }
            console.log('after that...' + user);

            req.login(user, { session: false }, (err) => {
                if (err) {
                    res.send(err);
                }

                const token = jwt.sign(user.dataValues, 'your_jwt_secret');

                if (req.isMechanic == true) {
                    Mechanic.findOrCreate({ where: { user: user }, defaults: { isActive: true }})
                    .spread( function(mechanic, created) {
                        return res.json({user, mechanic, token })
                    })
                } else {
                    return res.json({ user, token });
                }   
            });
        })
            (req, res);
            
    });

};





