const constants = require('../routes/constants.js');
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

/**
 * Verify a phone number
 *
 * @param {!string} phone_number
 * @param {!string} country_code
 * @param {!string} token
 * @param {!function} callback
 */
Taxes.prototype.fetchTotalDrivingDistance = function (taxYear, mechanic, callback) {
    const Op = this.models.Sequelize.Op;
    this.models.TransactionMetadata.sequelize.query('SELECT SUM (t."drivingDistance") / COUNT(t) AS total FROM "autoService" as a, "transactionMetadata" as t WHERE a."scheduledDate" > ? AND a."scheduledDate" < ? AND a."mechanicID" = ?;', {
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
    const Op = this.models.Sequelize.Op;
    this.models.TransactionMetadata.sequelize.query('SELECT SUM(t."mechanicCost") / COUNT(t) AS total FROM "autoService" as a, "transactionMetadata" as t WHERE a."scheduledDate" > ? AND a."scheduledDate" < ? AND a."mechanicID" = ?;', {
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

// Taxes.prototype.fetchTransactions = function (taxYear, mechanic, callback) {
//     const Op = this.models.Sequelize.Op;
//     this.models.TransactionMetadata.sequelize.query('SELECT *, t as transaction FROM "autoService" as a, "transactionMetadata" as t WHERE a."scheduledDate" > ? AND a."scheduledDate" < ? AND a."mechanicID" = ?;', {
//         replacements: [this.startOfYear(taxYear), this.endOfYear(taxYear), mechanic.id],
//         type: this.models.sequelize.QueryTypes.SELECT,
//         model: this.models.AutoService
//     }).then(ts => {
//         // console.log('mechanicID: ' + mechanic.id + ', value: ' + ts[0].dataValues.mechanicID);
//         callback(ts);
//         // callback(parseInt(mechanicCost[0].dataValues.total), null);
//     }).catch(err => {
//         console.log(err);
//         callback(null, err);
//     });
// };

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
