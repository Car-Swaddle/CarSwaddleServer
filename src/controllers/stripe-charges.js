const constants = require('./constants.js');
const { Op } = require('sequelize');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);

const ALL_PRICE_TYPES = ['oilChange', 'distance', 'bookingFee', 'processingFee', 'bookingFeeDiscount'];
const PROCESSING_FEE_PRICE_TYPES = ['oilChange', 'distance', 'bookingFee', 'bookingFeeDiscount'];

const TAX_RATE_ID = 'txr_1EsKFiDGwCXJzLurboddwtFb';
const TAX_RATE_PERCENTAGE = 0.0715;

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

StripeCharges.prototype.payInvoices = async function(sourceID, autoServiceID) {
    if (sourceID == null || autoServiceID == null) {
        return res.status(422).send();
    }

    const autoService = await this.models.AutoService.findById(autoServiceID);
    const mechanic = await autoService.getMechanic();

    if (mechanic == null || autoService == null) {
        return res.status(422).send();
    }

    const invoice = await stripe.invoices.pay(autoService.invoiceID, {
        source: sourceID,
    });

    const transfer = await stripe.transfers.create({
        amount: parseInt(invoice.metadata.transferAmount, 10),
        currency: "usd",
        destination: mechanic.stripeAccountID,
        source_transaction: invoice.charge,
    });

    await stripe.invoices.update(invoice.id, {
        metadata: {
            transfer: transfer.id,
        }
    });

    return { invoice, transfer };
};

StripeCharges.prototype.updateDraft = async function(customer, prices, metadata, coupon) {
    const invoiceUpdates = {
        customer,
        default_tax_rates: [TAX_RATE_ID],
        description: "Oil Change from Car Swaddle",
        statement_descriptor: "Car Swaddle Oil Change",
        metadata,
        coupon,
    };
    const invoices = await stripe.invoices.list({
        status: 'draft',
        customer
    });
    var finalInvoice;

    prices.processingFee = calculateProcessingFee(prices, TAX_RATE_PERCENTAGE);

    if(!invoices.data[0]) {
        for(var i = 0; i < ALL_PRICE_TYPES.length; i++) {
            const priceType = ALL_PRICE_TYPES[i];
            const amount = prices[priceType];

            // TODO: Look for pending line items.

            if(amount != null) {
                await stripe.invoiceItems.create({
                    customer,
                    amount,
                    currency: "usd",
                    description: invoiceLineDescription(priceType),
                    metadata: {
                        priceType,
                    }
                });
            }
        }

        finalInvoice = await stripe.invoices.create(invoiceUpdates)
    } else {
        const invoice = invoices.data[0];
        const existingLines = invoice.lines.data;
        
        for(let i = 0; i < ALL_PRICE_TYPES.length; i++) {
            const priceType = ALL_PRICE_TYPES[i];
            const existingLine = existingLines.find(line => line.metadata.priceType === priceType);
            const amount = prices[priceType];
    
            if(existingLine && existingLine.amount !== amount) {
                if(amount == null) {
                    await stripe.invoiceItems.del(existingLine.id);
                } else {
                    await stripe.invoiceItems.update(
                        existingLine.id,
                        { amount }
                    );
                }
            } else if(!existingLine && amount != null) {
                await stripe.invoiceItems.create({
                    invoice: invoice.id,
                    amount,
                    currency: "usd",
                    description: invoiceLineDescription(priceType),
                    metadata: {
                        priceType,
                    }
                });
            }
        }

        delete invoiceUpdates.customer;

        finalInvoice = await stripe.invoices.update(invoice.id, invoiceUpdates);
    }

    prices.taxes = finalInvoice.tax || 0;
    prices.total = finalInvoice.total;

    return prices;
};

StripeCharges.prototype.createCoupon = function(userId, coupon) {
    return stripe.coupons.create({
        duration: 'once',
        amount_off: coupon.amountOff,
        currency: 'usd',
        max_redemptions: coupon.maxRedemptions,
        metadata: {
            user_id: userId,
            noBookingFee: coupon.discountBookingFee ? 'YES' : null,
        },
        name: coupon.name,
        percent_off: coupon.percentOff,
        redeem_by: new Date(coupon.redeemBy),
    });
};

StripeCharges.prototype.removeCoupon = function(couponId) {
    return stripe.coupons.del(couponId);
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

function invoiceLineDescription(priceType) {
    switch(priceType) {
        case 'oilChange':
            return 'Oil Change';
        case 'distance':
            return 'Travel Time';
        case 'bookingFee':
            return 'Car Swaddle Booking Fee';
        case 'processingFee':
            return 'Processing Fee';
        case 'bookingFeeDiscount':
            return 'Car Swaddle Booking Fee Discount';
        default:
            return '';
    }
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


function calculateProcessingFee(prices, taxPercentage) {
    // d = ((s+b)+0.30)/(1-0.029)
    // fee = d - (s+b)
    // The mechanic will make a little bit more than what we will take out for the stripeConnectProcessFee because we add
    // the product of the stripeConectFee and the entire total instead of just what the mechanic gets. The profit goes to
    // the mechanic.
    
    // Covers Stripe charge fee %3 and the connect payout volume %0.25 fee 
    const stripeProcessPercentage = 0.029;
    const stripeConnectProcessPercentage = 0.025;
    // in cents
    const stripeProcessTransactionFee = 30;

    const feeTotal = Object.keys(prices)
    .filter(type => PROCESSING_FEE_PRICE_TYPES.indexOf(type) !== -1)
    .reduce((amount, type) => amount + (prices[type] || 0), 0);
    const estimatedTaxes = Math.round(feeTotal * taxPercentage);
    const subtotal = feeTotal + estimatedTaxes;

    var connectFee = subtotal / (1.0 - (stripeConnectProcessPercentage));
    connectFee = connectFee - subtotal;

    const basePrice = subtotal + (subtotal * constants.BOOKING_FEE_PERCENTAGE) + connectFee;
    const total = (basePrice + stripeProcessTransactionFee) / (1.0 - (stripeProcessPercentage));

    return Math.round(total - basePrice);
}