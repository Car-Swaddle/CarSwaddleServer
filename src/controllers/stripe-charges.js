const constants = require('./constants.js');
const { Op } = require('sequelize');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);


const stripeConnectProcessPercentage = 0.0025;
const stripeConnectAccountDebitPercentage = 0.015;
const stripeConnectMonthlyDebit = 200;
const stripeConnectPayoutDebitAmount = 25;

module.exports = function (models) {
    return new StripeCharges(models);
};

function StripeCharges(models) {
    this.models = models;
    this.init();
}

StripeCharges.prototype.init = function () {

};

StripeCharges.prototype.createDebitTransfer = function (totalDebit, mechanic, description) {
    return stripe.transfers.create({
        amount: totalDebit,
        currency: "usd",
        destination: constants.STRIPE_PLATFORM_ACCOUNT_ID,
        description: description
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

StripeCharges.prototype.createPayoutDebit = function (mechanicID, payoutID) {
    return this.models.MechanicPayoutDebit.create({
        id: uuidV1(),
        mechanicID: mechanicID,
        payoutID: payoutID
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

StripeCharges.prototype.createCharge = async function(sourceID, autoServiceID, user) {
    if (sourceID == null || autoServiceID == null) {
        return res.status(422).send();
    }

    var autoService = await this.models.AutoService.findById(autoServiceID);
    var mechanic = await autoService.getMechanic();
    var price = await autoService.getPrice();
    var priceParts = await price.getPriceParts();

    if (price == null || priceParts == null || mechanic == null || autoService == null) {
        return res.status(422).send();
    }

    const destinationAmount = this.generateDestinationAmount(priceParts);

    return stripe.charges.create({
        amount: Math.floor(price.totalPrice),
        currency: "usd",
        source: sourceID,
        customer: user.stripeCustomerID,
        description: "Oil Change from Car Swaddle",
        statement_descriptor: "Car Swaddle Oil Change",
        transfer_data: {
            amount: Math.floor(destinationAmount),
            destination: mechanic.stripeAccountID,
        },
        receipt_email: user.email,
        metadata: {
            mechanicID: mechanic.id,
            userID: user.id,
            priceID: price.id,
            autoServiceID: autoServiceID,
        }
    });
};

StripeCharges.prototype.generateDestinationAmount = function (priceParts) {
    for (var i = 0; i < priceParts.length; i++) {
        var pricePart = priceParts[i];
        if (pricePart.key == 'subtotal') {
            return pricePart.value
        }
    }

    return subtotalPricePart.value
};

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
                return this.createDebitTransfer(totalDebit, mechanic, 'Account volume fee and monthly service fee');
            });
        } else {
            return this.createDebitTransfer(totalDebit, mechanic, 'Account volume fee');
        }
    });
}

StripeCharges.prototype.listPayoutDebits = function (limit, mechanicID, callback) {
    this.models.MechanicPayoutDebit.findAll({
        where: {
            mechanicID: mechanicID
        },
        limit: limit
    }).then(payoutDebits => {
        callback(null, payoutDebits);
    }).catch(err => {
        callback(err, null);
    });
}

StripeCharges.prototype.performPayoutDebits = function (mechanic, callback) {
    const limit = 50;
    var self = this;
    listPayouts(limit, mechanic.stripeAccountID, function (payoutsError, payouts) {
        if (payoutsError != null || payouts == null || payouts.data == null) {
            callback(payoutsError);
            return;
        }
        self.listPayoutDebits(limit, mechanic.id, function (debitError, payoutDebits) {
            if (debitError != null) {
                callback(debitError);
                return;
            }
            const payoutsDict = unfeedPayouts(payouts.data, payoutDebits);
            const numberOfPayoutDebits = Object.keys(payoutsDict).length;
            const payoutDebitAmount = numberOfPayoutDebits * stripeConnectPayoutDebitAmount;

            var description = 'Payout account fee';
            if (numberOfPayoutDebits > 1) {
                description = 'Payout account fee for ' + numberOfPayoutDebits + ' payouts'
            } else {
                callback(null);
                return;
            }

            self.createDebitTransfer(payoutDebitAmount, mechanic, description).then(transfer => {
                var promises = [];
                for (var key in payoutsDict) {
                    const unfeedPayout = payoutsDict[key];
                    const promise = self.createPayoutDebit(mechanic.id, unfeedPayout.id)
                    promises.push(promise);
                }
                Promise.all(promises).then(values => {
                    callback(null);
                }).catch(error => {
                    callback(error);
                });
            }).catch(error => {
                console.log(error);
            });
        });
    });
}

function unfeedPayouts(payouts, payoutDebits) {
    var payoutsDict = {};
    for (var i = 0; i < payouts.length; i++) {
        payoutsDict[payouts[i].id] = payouts[i];
    }
    for (var i = 0; i < payoutDebits.length; i++) {
        delete payoutsDict[payoutDebits[i].payoutID];
    }

    return payoutsDict;
}

function listPayouts(limit, stripeID, callback) {
    stripe.payouts.list({
        limit: limit,
        status: 'paid',
    }, { stripe_account: stripeID }, function (err, payouts) {
        callback(err, payouts);
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
