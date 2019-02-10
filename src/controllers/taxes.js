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
Taxes.prototype.fetchTotalDrivingDistance = function (tax_year, mechanic, callback) {
    const Op = this.models.Sequelize.Op;
    this.models.TransactionMetadata.sum('drivingDistance', {
        where: {
            mechanicID: mechanic.id
        },
        group: ['transactionMetadata.id', 'autoService.id'],
        include: [{
            model: this.models.AutoService,
            where: {
                scheduledDate: {
                    [Op.between]: [this.startOfYear(tax_year), this.endOfYear(tax_year)]
                }
            }
        }]
    }).then(metersDriven => {
        console.log(metersDriven);
        callback(metersDriven, null);
    }).catch(err => {
        console.log(err);
        callback(null, err);
    });
};

Taxes.prototype.fetchTotalMechanicCost = function (tax_year, mechanic, callback) {
    const Op = this.models.Sequelize.Op;
    this.models.TransactionMetadata.sum('mechanicCost', {
        where: {
            mechanicID: mechanic.id
        },
        group: ['transactionMetadata.id', 'autoService.id'],
        include: [{
            model: this.models.AutoService,
            where: {
                scheduledDate: {
                    [Op.between]: [this.startOfYear(tax_year), this.endOfYear(tax_year)]
                }
            }
        }]
    }).then(mechanicCost => {
        console.log(mechanicCost);
        callback(mechanicCost, null);
    }).catch(err => {
        console.log(err);
        callback(null, err);
    });
};



/**
 * Request a phone verification
 *
 * @param {!string} phone_number
 * @param {!string} country_code
 * @param {!string} via
 * @param {!function} callback
 */
Taxes.prototype.requestPhoneVerification = function (phone_number, country_code, via, callback) {
    this._request("post", "/protected/json/phones/verification/start", {
        "api_key": this.apiKey,
        "phone_number": phone_number,
        "via": via || 'sms',
        "country_code": country_code || 1,
        "code_length": 5
    },
        callback
    );
};


Taxes.prototype.startOfYear = function (year) {
    var date = new Date(year, 0, 1);
    return date
};

Taxes.prototype.endOfYear = function (year) {
    var date = new Date(year, 11, 31);
    date.setHours(23, 59, 59, 99)
    return date
};
