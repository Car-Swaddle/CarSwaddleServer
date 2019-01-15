const uuidV1 = require('uuid/v1');
const constants = require('../constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const fileStore = require('../../data/file-store.js');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');


module.exports = function (router, models) {

  router.get('/', function (req, res, next) {
    return res.send('respond with a resource');
  });

  /* GET user profile. */
  router.get('/current-user', bodyParser.json(), function (req, res, next) {
    return res.send(req.user);
  });

  router.post('/data/profile-picture', fileUpload(), function (req, res) {
    if (req.files == null) {
      return res.status(400).send('No files were uploaded.');
    }
    if (Object.keys(req.files).length == 0) {
      return res.status(400).send('No files were uploaded.');
    }
    let file = req.files.image;
    fileStore.uploadImage(file.data, req.user.profileImageID).then(name => {
      console.log(name);
      if (name != null) {
        req.user.profileImageID = name;
        req.user.save().then(user => {
          return res.status(200).json({ 'profileImageID': name });
        }).catch(error => {
          return res.status(400).send('Unable to upload image to user');
        });
      } else {
        return res.status(400).send('Unable to upload image');
      }
    });
  });

  router.get('/data/image/:name', bodyParser.json(), function (req, res) {
    const fileName = req.params.name;
    if (fileName == null) {
      return res.status(422).send('invalid parameters');
    }
    fileStore.getImage(fileName).then(data => {
      if (data == null) {
        console.log(err);
        res.status(404).send();
      }
      res.writeHead(200, { 'Content-Type': 'image/*' });
      res.write(data.Body, 'binary');
      res.end(null, 'binary');
    }).catch(error => {
      return res.status(400).send('unable to fetch profile image');
    });
  });

  router.get('/data/profile-picture/:userID', bodyParser.json(), function (req, res) {
    const userID = req.params.userID;
    if (userID == null) {
      return res.status(422).send('invalid parameters');
    }
    models.User.findById(userID).then(user => {
      fileStore.getImage(user.profileImageID).then(data => {
        if (data == null) {
          console.log(err);
          res.status(404).send();
        }
        res.writeHead(200, { 'Content-Type': 'image/*' });
        res.write(data.Body, 'binary');
        res.end(null, 'binary');
      }).catch(error => {
        return res.status(400).send('unable to fetch profile image');
      });
    }).catch(error => {
      return res.status(400).send('unable to fetch profile image');
    });
  });

  router.patch('/update-user', bodyParser.json(), function (req, res) {
    const body = req.body;
    var user = req.user;
    var didChangeUser = false;

    var promises = [];

    if (body.firstName != null) {
      const promise = user.getMechanic().then(mechanic => {
        if (mechanic == null) {
          user.firstName = body.firstName;
          return user.save();
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
          return user.save();
        });
      });
      promises.push(promise);
      didChangeUser = true;
    }
    if (body.lastName != null) {
      const promise = user.getMechanic().then(mechanic => {
        if (mechanic == null) {
          user.lastName = body.lastName;
          return user.save();
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
          return user.save();
        });
      });
      promises.push(promise);
      didChangeUser = true;
    }
    if (body.phoneNumber != null) {
      const promise = user.getMechanic().then(mechanic => {
        if (mechanic == null) {
          user.phoneNumber = body.phoneNumber;
          return user.save();
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
          return user.save();
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

  router.get('/users', bodyParser.json(), function (req, res) {
    models.User.findAll({ offset: req.query.offset, limit: Math.min(req.query.limit, 100) }).then(users => {
      res.json(users);
    });
  });

  router.get('/user', bodyParser.json(), function (req, res) {
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
