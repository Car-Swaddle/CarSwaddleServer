const constants = require('./constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const pushService = require('../notifications/pushNotifications.js');
const liveEndpointSecret = 'whsec_w70LXPKXB954f8H41fKnc7HBIwrBHyoT';
const testEndpointSecret = 'whsec_Mihcejqv5prmk29eoHGuytmCFOwfDqzG';

module.exports = function (app, models) {

    // bodyParser.json()
    // bodyParser.raw({ type: '*/*' })

    app.post('/stripe-webhook', bodyParser.raw({ type: '*/*' }), async function (req, res) {
        var event = eventFromReq(req);

        console.log('stripe webhook');
        console.log(event);

        const stripeAccountID = event.account;

        if (event == null) {
            return res.status(200).send();
        }

        if (event.type == eventTypes.PAYOUT_PAID) {
            const amount = event.data.object.amount;
            if (stripeAccountID != null && amount != null) {
                findMechanicWithStripeID(stripeAccountID).then(mechanic => {
                    if (mechanic == null) {
                        return res.json({ received: true });
                    }
                    const dollars = dollarFormat(amount);
                    const alert = 'A deposit was paid of $' + dollars;
                    const title = 'Deposit: $' + dollars;
                    pushService.sendMechanicNotification(mechanic, alert, null, null, title);
                    return res.json({ received: true });
                });
            }
        } else if (event.type == eventTypes.PAYOUT_CANCELED) {

        } else if (event.type == eventTypes.PAYOUT_CREATED) {
            const amount = event.data.object.amount;
            if (stripeAccountID != null && amount != null) {
                findMechanicWithStripeID(stripeAccountID).then(mechanic => {
                    if (mechanic == null) {
                        return res.json({ received: true });
                    }
                    const dollars = dollarFormat(amount);
                    const alert = 'A Deposit was scheduled. $' + dollars;
                    const title = 'Deposit: $' + dollars;
                    pushService.sendMechanicNotification(mechanic, alert, null, null, title);
                    return res.json({ received: true });
                });
            }
        } else if (event.type == eventTypes.PAYOUT_FAILED) {
            const payoutID = event.data.object.id;
            const amount = event.data.object.amount;
            if (stripeAccountID != null && payoutID != null) {
                const mechanic = await findMechanicWithStripeID(stripeAccountID);
                if (mechanic == null) {
                    return res.json({ received: true });
                }
                const user = await mechanic.getUser();
                if (user == null) {
                    return res.json({ received: true });
                }
                const title = 'There was a problem completing a deposit';
                const alert = "Your deposit of $" + dollarFormat(amount) + " was unable to be deposited. Tap here to see what you can do to fix this issue.";
                const payload = {
                    payoutID: payoutID
                };
                pushService.sendMechanicNotification(mechanic, alert, payload, 1, title);
                return res.json({ received: true });
            }
        } else if (event.type == eventTypes.PAYOUT_UPDATED) {

        } else if (event.type == eventTypes.CHARGE_SUCCEEDED) {
            
        } else if (event.type == eventTypes.ACCOUNT_UPDATED) {
            const verification = event.data.object.verification;
            if (!verification) {
                return res.json({ received: true });
            }
            const fieldsNeeded = verification.fields_needed;
            const previousFieldsNeeded = event.data.previous_attributes.verification.fields_needed;

            const fieldsSame = fieldsNeeded.every(function (u, i) {
                return u === previousFieldsNeeded[i];
            });
            const isPreviousLessThanCurrent = previousFieldsNeeded.length < fieldsNeeded.length;

            if (isPreviousLessThanCurrent && fieldsSame && stripeAccountID != null) {
                const mechanic = await findMechanicWithStripeID(stripeAccountID);
                if (mechanic == null) {
                    return res.json({ received: true });
                }
                const user = await mechanic.getUser();
                if (!user) {
                    return res.json({ received: true });
                }
                const title = user.firstName + ', your account needs some attention';
                const alert = "You'll need to update your account to receive funds. Tap here to see exacly what you need to update.";
                pushService.sendMechanicNotification(mechanic, alert, null, null, title);
                return res.json({ received: true });
            }
        }

        return res.json({ received: true });
    });

    const isLocal = false

    function eventFromReq(req) {
        if (isLocal) {
            return req.body;
        } else {
            var sig = req.headers["stripe-signature"];
            var body = req.body;
            try {
                return stripe.webhooks.constructEvent(body, sig, testEndpointSecret);
            } catch (err) {
                console.log(err);
                return null;
            }
        }
    }

    function findMechanicWithStripeID(destination) {
        return models.Mechanic.findOne({ where: { stripeAccountID: destination } });
    }

    function dollarFormat(cents) {
        return (cents / 100.0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // charge.succeeded

    const eventTypes = {
        PAYOUT_PAID: 'payout.paid',
        PAYOUT_CANCELED: 'payout.canceled',
        PAYOUT_CREATED: 'payout.created',
        PAYOUT_FAILED: 'payout.failed',
        PAYOUT_UPDATED: 'payout.updated',
        ACCOUNT_UPDATED: 'account.updated',
        CHARGE_SUCCEEDED: 'charge.succeeded',
    }

    const payoutFailures = {
        ACCOUNT_CLOSED: 'account_closed', // The bank account has been closed. Update bank account info
        ACCOUNT_FROZEN: 'account_frozen', // The bank account has been frozen. Contact bank or update bank info
        BANK_ACCOUNT_RESTRICTED: 'bank_account_restricted', // The bank account has restrictions on either the type, or the number, of payouts allowed. This normally indicates that the bank account is a savings or other non-checking account. Contact bank, or change account
        BANK_OWNERSHIP_CHANGED: 'bank_ownership_changed', // The destination bank account is no longer valid because its branch has changed ownership. Update your bank account info
        COULD_NOT_PROCESS: 'could_not_process', // The bank could not process this payout. Make sure the info is correct, if it is contact your bank to process.
        DEBIT_NOT_AUTHORIZED: 'debit_not_authorized', // Debit transactions are not approved on the bank account. (Stripe requires bank accounts to be set up for both credit and debit payouts.) Contact your bank to make the account allow debits. OR update info
        DECLINED: 'declined', // The bank has declined this transfer. Please contact the bank before retrying. Contact bank or update info
        INSUFFICIENT_FUNDS: 'insufficient_funds', // Your bank account did not have enough money for a negative payout we tried to make against it. Make sure funds are entered, or update the bank account.
        INVALID_ACCOUNT_NUMBER: 'invalid_account_number', // The routing number seems correct, but the account number is invalid. Update your bank account to a valid account
        INCORRECT_ACCOUNT_HOLDER_NAME: 'incorrect_account_holder_name', // Your bank notified us that the bank account holder name on file is incorrect. Update your bank info.
        INVALID_CURRENCY: 'invalid_currency', // The bank was unable to process this payout because of its currency. This is probably because the bank account cannot accept payments in that currency. Update your bank account to one that accepts the same currency.
        NO_ACCOUNT: 'no_account', // No bank account could be found with the details provided. This occurs if incorrect information has been provided. Update bank account info
        UNSUPPORTED_CARD: 'unsupported_card', // The bank no longer supports payouts to this card. Update bank account info.
    }

    function decriptionForPayoutFailure(failure) {
        if (failure == payoutFailures.ACCOUNT_CLOSED) {
            return '';
        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        } else if (failure == payoutFailures.ACCOUNT_CLOSED) {

        }
    }

};