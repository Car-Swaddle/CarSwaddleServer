const constants = require('./constants.js');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const Email = require('../notifications/email');

const ALL_PRICE_TYPES = ['discount', 'oilChange', 'distance', 'bookingFee', 'processingFee', 'bookingFeeDiscount', 'taxes', 'giftCard'];

const stripeConnectProcessPercentage = 0.0025;
const stripeConnectAccountDebitPercentage = 0.015;
const stripeConnectMonthlyDebit = 200;
const stripeConnectPayoutDebitAmount = 25;

module.exports = function (models) {
    return new StripeCharges(models);
};

function StripeCharges(models) {
    this.models = models;
    this.emails = new Email(models);
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

StripeCharges.prototype.executeMechanicTransfer = async function(paymentIntentID) {
    const transactionMetadata = await this.models.TransactionMetadata.fetchWithPaymentIntentID(paymentIntentID);
    if (!transactionMetadata) {
        console.warn(`No mechanic with payment intent id: ${paymentIntentID}`)
        return;
    }
    await this.executeMechanicTransferWithMetadata(transactionMetadata);
}

StripeCharges.prototype.executeMechanicTransferWithMetadata = async function(transactionMetadata) {
    if (!transactionMetadata) {
        console.warn(`No transaction metadata to execute mechanic transfer`)
        return;
    }

    if (!transactionMetadata.mechanicTransferAmount || transactionMetadata.mechanicTransferAmount == 0) {
        console.warn(`No mechanic amounts to transfer: ${transactionMetadata?.id ?? "missing"}`)
        return;
    }
    
    if (transactionMetadata.stripeMechanicTransferID) {
        console.warn(`Mechanic transaction id already found: ${transactionMetadata.stripeMechanicTransferID}`)
        return;
    }
    
    const mechanic = await transactionMetadata.getMechanic();
    if (!mechanic || !mechanic.stripeAccountID) {
        console.warn(`Mechanic missing or no stripe account id ${transactionMetadata.mechanicID}`)
        return;
    }

    const autoServiceID = transactionMetadata.autoServiceID;
    const transfer = await stripe.transfers.create({
        amount: transactionMetadata.mechanicTransferAmount,
        currency: 'usd',
        destination: mechanic.stripeAccountID,
        description: `Transfer to mechanic ${mechanic.id}`,
        metadata: {
            mechanicID: mechanic.id,
            autoServiceID: autoServiceID,
            paymentIntentID: paymentIntentID,
        },
        transfer_group: autoServiceID,
    });
    transactionMetadata.stripeMechanicTransferID = transfer.id;

    await transactionMetadata.save();
}

StripeCharges.prototype.createReferrerTransferIfNecessary = async function(autoServiceID) {
    // Fetch matching transaction metadata
    const transactionMetadata = await this.models.TransactionMetadata.findOne({
        where: {
            autoServiceID: autoServiceID
        },
    });

    if (!transactionMetadata || !transactionMetadata.referrerID || transactionMetadata.stripeReferrerTransferID) {
        return;
    }

    const referrer = await this.models.Referrer.findByPk(transactionMetadata.referrerID);

    if (!referrer || !referrer.stripeExpressAccountID) {
        throw `No referrer stripe account, can't transfer for ${referrerID}`;
    }

    async function updateMetadataStripeTransferID(transactionMetadata, transferID) {
        transactionMetadata.stripeReferrerTransferID = transferID;
        await transactionMetadata.save({ fields: ['stripeReferrerTransferID'] });
    }

    await updateMetadataStripeTransferID(transactionMetadata, "IN_PROGRESS");

    const transfer = await stripe.transfers.create({
        amount: transactionMetadata.referrerTransferAmount,
        currency: 'usd',
        destination: referrer.stripeExpressAccountID,
        description: `Transfer to referrer ${referrer.id}`,
        metadata: {
            referrerID: referrer.id,
            autoServiceID: autoServiceID,
        },
    });

    if (!transfer || !transfer.id) {
        await updateMetadataStripeTransferID(transactionMetadata, null);
        throw "Failed to create transfer";
    }

    try {
        await updateMetadataStripeTransferID(transactionMetadata, transfer.id);
    } catch (e) {
        await stripe.transfers.createReversal(
            transfer.id,
        )
        throw `Failed to persist stripe transfer id: ${transfer.id}, reversed`
    }
}

StripeCharges.prototype.payInvoices = async function(invoiceID, sourceID, mechanicID, serviceTotal, transferAmount) {
    const mechanic = await this.models.Mechanic.findByPk(mechanicID);

    var invoice = null, transfer = null;

    if (sourceID == null || invoiceID == null || mechanic == null) {
        return {invoice, transfer}
    }

    try {
        if (serviceTotal > 0) {
            invoice = await stripe.invoices.pay(invoiceID, {
                payment_method: sourceID,
            });
        }
    } catch(e) {
        console.log(e);
     }

    try {
        if(transferAmount > 0) {
            transfer = await stripe.transfers.create({
                amount: transferAmount,
                currency: "usd",
                destination: mechanic.stripeAccountID,
                source_transaction: transferAmount > (invoice?.amount_paid ?? 0) ? undefined : invoice.charge,
                expand: ['destination_payment'],
            });
        }

        await stripe.invoices.update(invoiceID, {
            metadata: {
                transfer: transfer ? transfer.id : null,
            }
        });
    } catch(e) {
        this.emails.sendAdminEmail('MISSED TRANSFER', `invoice id ${invoice.id} for amount ${transferAmount} mechanicId ${mechanicID}\n\n${e.stack}`);
    }

    return { invoice, transfer };
};

StripeCharges.prototype.retrieveDraftInvoice = async function(customer) {
    const invoices = await stripe.invoices.list({
        status: 'draft',
        customer
    });

    return invoices.data[0];
}

StripeCharges.prototype.listUpcomingLineItems = function(customer) {
    return stripe.invoices.listUpcomingLineItems({ customer, limit: 100 })
    .then(res => res.data)
    .catch(err => {
        return err.code === 'invoice_upcoming_none'
            ? []
            : Promise.reject(err);
    });
}

StripeCharges.prototype.updateDraft = async function(customer, prices, metadata, taxRate) {
    const draftInvoice = await this.retrieveDraftInvoice(customer);
    const existingLines = draftInvoice
        ? draftInvoice.lines.data
        : await this.listUpcomingLineItems(customer);
    
    for(let i = 0; i < ALL_PRICE_TYPES.length; i++) {
        const priceType = ALL_PRICE_TYPES[i];
        const existingLine = existingLines.find(line => line.metadata.priceType === priceType);
        const amount = prices[priceType];

        if(existingLine) {
            existingLines.splice(existingLines.indexOf(existingLine), 1);
        }

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
                customer,
                invoice: draftInvoice && draftInvoice.id,
                amount,
                currency: "usd",
                description: invoiceLineDescription(priceType),
                metadata: {
                    priceType,
                }
            });
        }
    }

    for(let i = 0; i < existingLines.length; i++) {
        await stripe.invoiceItems.del(existingLines[i].id);
    }

    const invoiceUpdates = {
        customer: draftInvoice ? undefined : customer,
        description: "Oil Change from Car Swaddle",
        statement_descriptor: "Car Swaddle Oil Change",
        metadata,
    };

    const finalInvoice = draftInvoice
        ? await stripe.invoices.update(draftInvoice.id, invoiceUpdates)
        : await stripe.invoices.create(invoiceUpdates);

    return finalInvoice;
};

/**
 * Performs a debit on an auto service. If the montly stripe debit is required, this method will perform that debit as well.
 *
 * @param mechanic Mechanic
 * @param mechanicPayment integer
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
        case 'discount':
            return 'Discount from coupon';
        case 'giftCard':
            return 'Gift card';
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
