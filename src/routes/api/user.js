const uuidV1 = require('uuid/v1');
const constants = require('../constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);

module.exports = function (router, models) {

  router.get('/', function (req, res, next) {
    res.send('respond with a resource');
  });

  /* GET user profile. */
  router.get('/current-user', function (req, res, next) {
    res.send(req.user);
  });

  router.patch('/update-user', function (req, res) {
    const body = req.body;
    var user = req.user;
    var didChangeUser = false;

    var promises = [];

    if (body.firstName != null) {
      const promise = user.getMechanic().then(mechanic => {
        if (mechanic == null) {
          return;
        }
        return stripe.accounts.update(mechanic.stripeAccountID, {
          legal_entity: {
            first_name: body.firstName,
          }
        }).then(stripeAccount => {
          if (stripeAccount == null) {
            return;
          }
          user.firstName = body.firstName;
        });
      });
      promises.push(promise);
      didChangeUser = true;
    }
    if (body.lastName != null) {
      const promise = user.getMechanic().then(mechanic => {
        if (mechanic == null) {
          return;
        }
        return stripe.accounts.update(mechanic.stripeAccountID, {
          legal_entity: {
            last_name: body.lastName,
          }
        }).then(stripeAccount => {
          if (stripeAccount == null) {
            return;
          }
          user.lastName = body.lastName;
        });
      });
      promises.push(promise);
      didChangeUser = true;
    }
    if (body.phoneNumber != null) {
      const promise = user.getMechanic().then(mechanic => {
        if (mechanic == null) {
          return;
        }
        return stripe.accounts.update(mechanic.stripeAccountID, {
          legal_entity: {
            phone_number: body.phoneNumber,
          }
        }).then(stripeAccount => {
          if (stripeAccount == null) {
            return;
          }
          user.phoneNumber = body.phoneNumber;
        });
      });
      promises.push(promise);
      didChangeUser = true;
    }
    if (body.token != null) {
      var promise = models.DeviceToken.findOne({
        where: {
          token: body.token,
          userID: user.id
        }
      }).then(deviceToken => {
        if (deviceToken == null) {
          return models.DeviceToken.create({
            id: uuidV1(),
            token: body.token
          }).then(deviceToken => {
            user.addDeviceToken(deviceToken);
            return user.save();
          });
        } else {
          return null;
        }
      });

      promises.push(promise);
      didChangeUser = true;
    }
    if (didChangeUser == true) {
      Promise.all(promises).then(values => {
        user.save().then(savedUser => {
          return res.send(savedUser);
        });
      });
    } else {
      return res.send(user);
    }
  });

  router.get('/users', function (req, res) {
    models.User.findAll({ offset: req.query.offset, limit: Math.min(req.query.limit, 100) }).then(users => {
      res.json(users);
    });
  });

  router.get('/user', function (req, res) {
    console.log('/user GET' + req.id);

    if (req.id === null) {
      res.status(422).send('Invalid parameter(s)');
    }

    models.User.findById(req.query.id).then(user => {
      res.json(user);
    }).catch(error => {
      res.status(403).send('resource not found');
    });
  });

  return router;
};
