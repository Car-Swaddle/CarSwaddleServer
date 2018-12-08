const uuidV1 = require('uuid/v1');

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
      user.firstName = body.firstName;
      didChangeUser = true;
    }
    if (body.lastName != null) {
      user.lastName = body.lastName;
      didChangeUser = true;
    }
    if (body.phoneNumber != null) {
      user.phoneNumber = body.phoneNumber;
      didChangeUser = true;
    }
    if (body.token != null) {
      var promise = models.DeviceToken.findOne({
        where: {
          token: body.token,
          userID: user.id
        }
      }).then( deviceToken => {
        if (deviceToken == null) {
          return models.DeviceToken.create({
            id: uuidV1(),
            token: body.token
          }).then( deviceToken => {
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
      Promise.all(promises).then( values => {
        user.save().then( savedUser => {
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
      // var json = JSON.stringify({
      //   'user': user.toJSON(),
      // });
      res.json(user);
    }).catch(error => {
      res.status(403).send('resource not found');
    });
  });

  return router;
};
