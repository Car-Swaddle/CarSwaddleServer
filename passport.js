const passport = require('passport');
const uuidV1 = require('uuid/v1');
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
// const models = require('./src/models');
// const bCrypt = require('bcrypt-nodejs');

const LocalStrategy = require('passport-local').Strategy;

module.exports = function (models) {

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
        function (email, password, cb) {
            console.log('local login email: ' + email);
            return models.User.findOne({ where: { email: email } })
                .then(user => {
                    console.log('got users: ' + user);
                    if (!user || user.validPassword(password) == false) {
                        return cb(null, false, { message: 'Incorrect email or password.' });
                    }
                    return cb(null, user, { message: 'Logged In Successfully' });
                })
                .catch(err => cb(err));
        }
    ));



    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'your_jwt_secret'
    },
        function (jwtPayload, cb) {
            //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
            return models.User.findById(jwtPayload.id)
                .then(user => {
                    return cb(null, user);
                })
                .catch(err => {
                    return cb(err);
                });
        }
    ));

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        function (req, email, password, done) {
            console.log('sign up');
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                models.User.findOne({ where: { email: email } })
                    .then(user => {
                        console.log('user: ' + user);

                        // check to see if theres already a user with that email

                        if (user) {
                            return done('Cannot sign up', false, null);
                        } else {
                            models.User.create({
                                id: uuidV1(),
                                firstName: req.body.firstName,
                                lastName: req.body.lastName,
                                email: email,
                                phoneNumber: req.body.phoneNumber,
                                password: models.User.generateHash(password),
                            }).then((user) => {
                                var json = JSON.stringify({
                                    'user': user.toJSON(),
                                });
                                done(null, user, null);
                            });
                        }
                    });
            });
        })
    );

    return passport;

}
