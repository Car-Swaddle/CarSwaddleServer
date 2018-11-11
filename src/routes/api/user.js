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
    if (didChangeUser == true) {
      user.save().then( savedUser => {
        res.send(savedUser);
      });
    } else {
      res.send(user);
    }
  });

  // router.post('/user', function (req, res) {
  //   console.log('Hit /user post.');

  //   models.User.create({
  //     id: uuidV1(),
  //     firstName: req.body.firstName,
  //     lastName: req.body.lastName,
  //     email: req.body.email,
  //     phoneNumber: req.body.phoneNumber,
  //   }).then((user) => {
  //     console.log('Hit then.');
  //     var json = JSON.stringify({
  //       'user': user.toJSON(),
  //     });
  //     res.json(json);
  //   });
  // });

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
      var json = JSON.stringify({
        'user': user.toJSON(),
      });
      res.json(json);
    }).catch(error => {
      res.status(403).send('resource not found');
    });
  });

  return router;
};
