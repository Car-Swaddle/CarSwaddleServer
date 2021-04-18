const passport = require('passport');
const uuidV1 = require('uuid/v1');
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const LocalStrategy = require('passport-local').Strategy;

module.exports = function (models) {

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function (email, password, cb) {
        if (!email || !password) {
            // TODO - validate email + password are good
            return cb(null, false, {message: "Missing email or password"})
        }
        console.log('local login email: ' + email);
        return models.User.findOne({ where: { email: email } }).then(user => {
            console.log('got users: ' + JSON.stringify(user));
            if (!user || user.validPassword(password) == false) {
                console.log("Here");
                return cb(null, false, { message: 'Incorrect email or password.' });
            }
            return cb(null, user, { message: 'Logged In Successfully' });
        }).catch(err => cb(err));
    }));

    const hybridJwtExtractor = req => {
        var token = null;

        // Auth header 
        if (req && req.headers && req.headers.authorization) {
            token = ExtractJWT.fromAuthHeaderAsBearerToken()(req);
        }

        // Browser cookie
        if (req && req.cookies) {
            token = req.cookies["cs-jwt"];
        }

        return token;
    }

    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: hybridJwtExtractor,
        secretOrKey: 'your_jwt_secret'
    },
        function (jwtPayload, cb) {
            //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
            return models.User.findByPk(jwtPayload.id)
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
                        console.log('user: ' + JSON.stringify(user));

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
                                signUpReferrerID: req.body.referrerID
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
