const constants = require('../routes/constants.js');
const { Op } = require('sequelize');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);


const stripeConnectProcessPercentage = 0.0025;
const stripeConnectAccountDebitPercentage = 0.015;
const stripeConnectMonthlyDebit = 200;

module.exports = function (models) {
    return new StripeCharges(models);
};

function StripeCharges(models) {
    this.models = models;
    this.init();
}

StripeCharges.prototype.init = function () {

};

StripeCharges.prototype.createDebit = function (totalDebit, mechanic) {
    return stripe.transfers.create({
        amount: totalDebit,
        currency: "usd",
        destination: constants.STRIPE_PLATFORM_ACCOUNT_ID,
        description: 'Account volume fee'
    }, { stripe_account: mechanic.stripeAccountID });
}

StripeCharges.prototype.fetchMonthDebit = function (mechanicID) {
    return this.models.MechanicMonthDebit.findOne({
        where: {
            mechanicID: mechanicID,
            debitMonth: currentMonth(),
            debitYear: currentYear()
        }
    });
}

StripeCharges.prototype.createMonthDebit = function (mechanicID) {
    return this.models.MechanicMonthDebit.create({
        id: uuidV1(),
        mechanicID: mechanicID,
        debitMonth: currentMonth(),
        debitYear: currentYear()
    });
}

StripeCharges.prototype.accountVolumeFee = function (mechanicPayment) {
    var accountVolumeDebit = mechanicPayment / (1.0 - stripeConnectProcessPercentage);
    accountVolumeDebit = Math.ceil(accountVolumeDebit - mechanicPayment);

    var accountDebitFee = accountVolumeDebit / (1.0 - stripeConnectAccountDebitPercentage);
    accountDebitFee = Math.ceil(accountDebitFee - accountVolumeDebit);

    return accountVolumeDebit + accountDebitFee;
}

StripeCharges.prototype.monthlyDebitFee = function (mechanicPayment) {
    return stripeConnectMonthlyDebit;
}

/**
 * Performs a debit on an auto service. If the montly stripe debit is required, this method will perform that debit as well.
 *
 * @param {!Mechanic} mechanic
 * @param {!integer} mechanicPayment
 * @param {!function} callback
 */
StripeCharges.prototype.performDebit = function (mechanic, mechanicPayment) {
    return this.fetchMonthDebit(mechanic.id).then(mechanicMonthDebit => {
        var totalDebit = this.accountVolumeFee(mechanicPayment);
        if (!mechanicMonthDebit) {
            totalDebit += this.monthlyDebitFee();
            return this.createMonthDebit(mechanic.id).then(newMechanicDebit => {
                return this.createDebit(totalDebit, mechanic);
            });
        } else {
            return this.createDebit(totalDebit, mechanic);
        }
    });
}


function currentYear() {
    const currentDate = new Date();
    return currentDate.getFullYear();
}

function currentMonth() {
    const currentDate = new Date();
    return currentDate.getMonth();
}
