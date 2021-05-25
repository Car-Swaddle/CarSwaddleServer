const constants = require('./constants.js');
// var request = require('request');
const { Op } = require('sequelize');


module.exports = function (models) {
    return new Taxes(models);
};

function Taxes(models) {
    this.models = models;
    this.init();
}

Taxes.prototype.init = function () {

};

Taxes.prototype.fetchTotalDrivingDistance = function (taxYear, mechanic, callback) {
    this.models.TransactionMetadata.sequelize.query('SELECT SUM(t."drivingDistance") AS total FROM "transactionMetadata" as t, "autoService" as a WHERE a."scheduledDate" > ? AND a."scheduledDate" < ? AND a."mechanicID" = ? AND t."autoServiceID" = a.id;', {
        replacements: [this.startOfYear(taxYear), this.endOfYear(taxYear), mechanic.id],
        type: this.models.sequelize.QueryTypes.SELECT,
        model: this.models.AutoService
    }).then(metersDriven => {
        callback(parseInt(metersDriven[0].dataValues.total), null);
    }).catch(err => {
        console.log(err);
        callback(null, err);
    });
};

Taxes.prototype.fetchTotalMechanicCost = function (taxYear, mechanic, callback) {
    this.models.TransactionMetadata.sequelize.query('SELECT SUM(t."mechanicCost") AS total FROM "transactionMetadata" as t, "autoService" as a WHERE a."scheduledDate" > ? AND a."scheduledDate" < ? AND a."mechanicID" = ? AND t."autoServiceID" = a.id;', {
        replacements: [this.startOfYear(taxYear), this.endOfYear(taxYear), mechanic.id],
        type: this.models.sequelize.QueryTypes.SELECT,
        model: this.models.AutoService
    }).then(mechanicCost => {
        callback(parseInt(mechanicCost[0].dataValues.total), null);
    }).catch(err => {
        console.log(err);
        callback(null, err);
    });
};

Taxes.prototype.fetchTransactions = function (taxYear, mechanic, callback) {
    this.models.TransactionMetadata.sequelize.query('SELECT t.* FROM "transactionMetadata" as t, "autoService" as a WHERE a."scheduledDate" > ? AND a."scheduledDate" < ? AND a."mechanicID" = ? AND t."autoServiceID" = a.id;', {
        replacements: [this.startOfYear(taxYear), this.endOfYear(taxYear), mechanic.id],
        type: this.models.sequelize.QueryTypes.SELECT,
        model: this.models.AutoService
    }).then(ts => {
        // console.log('mechanicID: ' + mechanic.id + ', value: ' + ts[0].dataValues.mechanicID);
        callback(ts);
        // callback(parseInt(mechanicCost[0].dataValues.total), null);
    }).catch(err => {
        console.log(err);
        callback(null, err);
    });
};

Taxes.prototype.fetchYearsWithAnAutoService = function (mechanic, callback) {
    this.models.sequelize.query('SELECT EXTRACT(YEAR FROM "scheduledDate") FROM "autoService" GROUP BY EXTRACT(YEAR FROM "scheduledDate")', {
        replacements: [],
        type: this.models.sequelize.QueryTypes.SELECT,
        model: this.models.AutoService
    }).then(years => {
        var yearArray = [];
        for (var i=0; i<years.length; i++) {
            yearArray.push(years[i].dataValues.date_part.toString());
        }
        callback(yearArray, null);
    }).catch(err => {
        console.log(err);
        callback(null, err);
    });
};

Taxes.prototype.aggregationDict = function (mechanic, taxYear) {
    return {
        where: {
            mechanicID: mechanic.id
        },
        group: ['transactionMetadata.id', 'autoService.id'],
        include: [{
            model: this.models.AutoService,
            where: {
                scheduledDate: {
                    [Op.between]: [this.startOfYear(taxYear), this.endOfYear(taxYear)]
                }
            }
        }]
    }
}

Taxes.prototype.startOfYear = function (year) {
    var date = new Date(year, 0, 1);
    return date
};

Taxes.prototype.endOfYear = function (year) {
    var date = new Date(year, 11, 31);
    date.setHours(23, 59, 59, 99)
    return date
};

Taxes.prototype.taxMetadataForLocation = async function(location) {
    // TODO: Use spatial data to lookup tax rates for regions or use taxjar.

    return {
        id: utahTaxRate(),
        rate: 0.0715,
    };
}

function utahTaxRate() {
    if (process.env.ENV == 'staging') {
        return 'txr_1EsKFiDGwCXJzLurboddwtFb';
    } else if (process.env.ENV == 'dev') {
        return 'txr_1EsKFiDGwCXJzLurboddwtFb';
    } else {
        // Prod, default
        return 'txr_1F2D92DGwCXJzLur7MiO7w4u';
    }
}

