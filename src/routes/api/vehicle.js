const bodyParser = require('body-parser');
const vehicleLookup = require('../../data/vehicle-lookup').VehicleLookup
const util = require('../../util/util').Util
const VehicleService = require('../../controllers/vehicle').VehicleService

module.exports = function (router, models) {
    const vehicleService = new VehicleService(models);

    router.get('/vehicle/lookup/:field', bodyParser.json(), (req, res, next) => {
        const field = req.params.field;
        if (!field) {
            return res.status(400).send({message: "Missing field"});
        }
        const year = req.query.year;
        const make = req.query.make;
        const model = req.query.model;
        const engine = req.query.engine;
        if (!util.isNullOrNumber(year) || !util.areNullOrStrings(make, model, engine)) {
            return res.status(400).send({message: "Invalid query params"});
        }
        switch (field) {
            case "YEAR":
                return res.status(200).send(vehicleLookup.listYears(make, model));
            case "MAKE":
                return res.status(200).send(vehicleLookup.listMakes(make, year));
            case "MODEL":
                if (!util.isString(make)) {
                    return res.status(400).send({message: "Make required"});
                }
                return res.status(200).send(vehicleLookup.listModels(make, model, year));
            case "ENGINE":
                if (!util.areStrings(make, model)) {
                    return res.status(400).send({message: "Make/model required"});
                }
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
        if (!util.isNullOrNumber(year) || !util.isNullOrString(engine) || !util.areStrings(make, model)) {
            return res.status(400).send({message: "Invalid query params"});
        }
        return res.status(200).send(vehicleLookup.getVehicleSpecs(make, model, year, engine));
    })

    /// Should only get vehicles for current user
    router.get('/vehicles', bodyParser.json(), async function (req, res, next) {
        const vehicles = await vehicleService.listVehiclesForUser(req.user.id, req.query.limit, req.query.offset);
        res.json(vehicles);
    });

    /// Should only get vehicles for current user
    router.get('/vehicle', bodyParser.json(), async function (req, res, next) {
        const vehicle = await vehicleService.getVehicle(req.query.id);
        res.json(vehicle);
    });

    router.put('/vehicle', bodyParser.json(), async function (req, res, next) {
        const vehicle = await vehicleService.updateVehicle(req.body, req.user);
        res.json(vehicle);
    });

    router.post('/vehicle', bodyParser.json(), async function (req, res, next) {
        const v = await vehicleService.createVehicle(req.body, req.user);
        res.json(v);
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