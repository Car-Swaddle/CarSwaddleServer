const bodyParser = require('body-parser');


module.exports = function (app, models) {

    const taxes = require('../../controllers/taxes.js')(models);

    app.get('/taxes', bodyParser.json(), async function (req, res, next) {
        if (req.user == null || !req.query.taxYear) {
            return res.status(400).send();
        }
        const mechanic = await req.user.getMechanic();
        taxes.fetchTotalDrivingDistance(req.query.taxYear, mechanic, function (metersDriven, err) {
            taxes.fetchTotalMechanicCost(req.query.taxYear, mechanic, function (mechanicCost, err) {
                res.json({
                    'taxYear': req.query.taxYear,
                    'metersDriven': metersDriven,
                    'mechanicCostInCents': mechanicCost
                }).send();
            });
        });
    });

};
