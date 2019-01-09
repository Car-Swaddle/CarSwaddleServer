const uuidV1 = require('uuid/v1');
const pushService = require('../../notifications/pushNotifications.js');
const bodyParser = require('body-parser');

module.exports = function (router, models) {

    /// Should only get vehicles for current user
    router.get('/vehicles', bodyParser.json(), function (req, res, next) {
        models.Vehicle.findAll({
            where: {
              userID: req.user.id
            },
            include: [{ model: models.AutoService, as: 'autoServices' }],
            offset: req.query.offset || 0,
            limit: Math.min(req.query.limit || 100, 100),
        }).then( vehicles => {
            return res.json(vehicles);
        });
    });

    /// Should only get vehicles for current user
    router.get('/vehicle', bodyParser.json(), function (req, res, next) {
        models.Vehicle.findOne({
            where: {
              userID: req.user.id,
              id: req.query.id
            }
        }).then( vehicle => {
            return res.json(vehicle);
        });
    });

    router.put('/vehicle', bodyParser.json(), function (req, res, next) {

        const body = req.body;
        const licensePlate = body.licensePlate;
        const vin = body.vin;
        const vehicleDescription = body.vehicleDescription;

        if (vin == null && licensePlate == null) {
            return res.status(422).send({
                message: 'Must provide one of vin, licensePlate or vehicleDescription.'
            });
        }

        models.Vehicle.findOne({
            where: {
              userID: req.user.id,
              id: req.query.id
            }
        }).then( vehicle => {
            vehicle.licensePlate = licensePlate;
            vehicle.vin = vin;
            vehicle.name = req.body.name;
            vehicle.save().then( savedVehicle => {
                return res.json(savedVehicle);
            });
        })
    });

    router.post('/vehicle', bodyParser.json(), function (req, res, next) {
        const body = req.body;
        const licensePlate = body.licensePlate;
        const vin = body.vin;
        const vehicleDescription = body.vehicleDescription;

        if (vin == null && licensePlate == null) {
            return res.status(422).send({
                message: 'Must provide one of vin, licensePlate or vehicleDescription.'
            });
        }

        const name = body.name || '';
        
        const vehicle = models.Vehicle.build({
            id: uuidV1(),
            name: name,
            vin: vin,
            licensePlate: licensePlate,
        });

        vehicle.setUser(req.user, { save: false });
        vehicle.save().then( vehicle => {
            return res.json(vehicle);
        })
    });

    router.delete('/vehicle', bodyParser.json(), function (req, res) {
        models.Vehicle.destroy({where: { id: req.query.id } }).then( deletedRows => {
            if (deletedRows > 0) {
                return res.send(''+deletedRows);
            } else {
                return res.status(409).send('0');
            }
        })
    });

    return router
};