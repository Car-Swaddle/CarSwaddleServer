const bodyParser = require('body-parser');


module.exports = function (app, models) {

    const taxes = require('../../controllers/taxes.js')(models);

    app.get('/taxes', bodyParser.json(), async function (req, res, next) {
        if (req.user == null || !req.query.taxYear) {
            return res.status(400).send();
        }
        const mechanic = await req.user.getMechanic();
        taxes.fetchTotalDrivingDistance(req.query.taxYear, mechanic, function (metersDriven, err) {
            if (!metersDriven) {
                metersDriven = 0;
            }
            taxes.fetchTotalMechanicCost(req.query.taxYear, mechanic, function (mechanicCost, err) {
                if (!mechanicCost) {
                    mechanicCost = 0;
                }
                res.json({
                    'taxYear': req.query.taxYear,
                    'metersDriven': metersDriven,
                    'mechanicCostInCents': mechanicCost
                }).send();
            });
        });
    });

    app.get('/tax-transactions', bodyParser.json(), async function (req, res) {
        if (req.user == null) {
            return res.status(400).send();
        }
        const mechanic = await req.user.getMechanic();
        taxes.fetchTransactions(req.query.taxYear, mechanic, function (mechanicCost, err) {
            return res.json(mechanicCost);
        });
    });

    app.get('/tax-years', bodyParser.json(), async function (req, res) {
        if (req.user == null) {
            return res.status(400).send();
        }
        const mechanic = await req.user.getMechanic();
        taxes.fetchYearsWithAnAutoService(mechanic, function (years) {
            return res.json(years);
        });
    });

};
