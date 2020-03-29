const uuidV1 = require('uuid/v1');
const pushService = require('../../notifications/pushNotifications.js');
const bodyParser = require('body-parser');
const vehicleLookup = require('../../data/vehicle-lookup').VehicleLookup
const util = require('../../util/util').Util

module.exports = function (router, models) {

    router.get('/vehicle/lookup/:field', bodyParser.json(), (req, res, next) => {
        const field = req.params.field;
        if (!field) {
            return res.status(400).send({message: "Missing field"});
        }
        const year = req.query.year;
        const make = req.query.make;
        const model = req.query.model;
        const engine = req.query.engine;
        if (!util.isNullOrNumber(year) || !util.areNullOrString([make, model, engine])) {
            return res.status(400).send({message: "Invalid query params"});
        }
        switch (field) {
            case "YEAR":
                return res.status(200).send(vehicleLookup.listYears(make, model));
            case "MAKE":
                return res.status(200).send(vehicleLookup.listMakes(make, year));
            case "MODEL":
                return res.status(200).send(vehicleLookup.listModels(make, model, year));
            case "ENGINE":
                return res.status(200).send(vehicleLookup.listEngines(make, model, year, engine));
            default:
                return res.status(400).send({message: "Unknown field type: " + field});
        }
    })

    router.get('/vehicle/lookup', bodyParser.json(), (req, res, next) => {
        const year = req.query.year;
        const make = req.query.make;
        const model = req.query.model;
        const engine = req.query.engine;
        if (!util.isNullOrNumber(year) || !util.areNullOrString([make, model, engine])) {
            return res.status(400).send({message: "Invalid query params"});
        }
        return res.status(200).send(vehicleLookup.getVehicleInfo(make, model, year, engine));
    })

    /// Should only get vehicles for current user
    router.get('/vehicles', bodyParser.json(), function (req, res, next) {
        models.Vehicle.findAll({
            where: {
              userID: req.user.id
            },
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
        const state = body.state;

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
            vehicle.state = state
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
        const state = body.state;

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
            state: state
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