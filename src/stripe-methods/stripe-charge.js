const constants = require('../routes/constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);

var methods = function (models) {

    this.createCharge = async function (sourceID, autoServiceID, user) {

        if (sourceID == null || autoServiceID == null) {
            return res.status(422).send();
        }

        var autoService = await models.AutoService.findById(autoServiceID);
        var mechanic = await autoService.getMechanic();
        var price = await autoService.getPrice();
        var priceParts = await price.getPriceParts();

        if (price == null || priceParts == null || mechanic == null || autoService == null) {
            return res.status(422).send();
        }

        const destinationAmount = generateDestinationAmount(priceParts);

        return stripe.charges.create({
            amount: Math.floor(price.totalPrice),
            currency: "usd",
            source: sourceID,
            customer: user.stripeCustomerID,
            description: "Oil Change from Car Swaddle",
            statement_descriptor: "Car Swaddle Oil Change",
            destination: {
                account: mechanic.stripeAccountID,
                amount: Math.floor(destinationAmount),
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

    function generateDestinationAmount(priceParts) {
        // const subtotalPricePart = priceParts.find(x => x.key === 'subtotal')[0];

        for (var i = 0; i < priceParts.length; i++) {
            var pricePart = priceParts[i];
            if (pricePart.key == 'subtotal') {
                return pricePart.value
            }
        }

        return subtotalPricePart.value
    };

};

module.exports = methods;
