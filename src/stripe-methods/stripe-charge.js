// const constants = require('../controllers/constants');
// const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);


// module.exports = function (models) {
//     return new StripeCharge(models);
// };

// function StripeCharge(models) {
//     this.models = models;
//     this.init();
// }

// StripeCharge.prototype.init = function () {

// };

// StripeCharge.prototype.createCharge = function(sourceID, autoServiceID, user) {
//     if (sourceID == null || autoServiceID == null) {
//         return res.status(422).send();
//     }

//     var autoService = await models.AutoService.findById(autoServiceID);
//     var mechanic = await autoService.getMechanic();
//     var price = await autoService.getPrice();
//     var priceParts = await price.getPriceParts();

//     if (price == null || priceParts == null || mechanic == null || autoService == null) {
//         return res.status(422).send();
//     }

//     const destinationAmount = generateDestinationAmount(priceParts);

//     return stripe.charges.create({
//         amount: Math.floor(price.totalPrice),
//         currency: "usd",
//         source: sourceID,
//         customer: user.stripeCustomerID,
//         description: "Oil Change from Car Swaddle",
//         statement_descriptor: "Car Swaddle Oil Change",
//         transfer_data: {
//             amount: Math.floor(destinationAmount),
//             destination: mechanic.stripeAccountID,
//         },
//         receipt_email: user.email,
//         metadata: {
//             mechanicID: mechanic.id,
//             userID: user.id,
//             priceID: price.id,
//             autoServiceID: autoServiceID,
//         }
//     });
// };

// StripeCharge.prototype.generateDestinationAmount = function (priceParts) {
//     for (var i = 0; i < priceParts.length; i++) {
//         var pricePart = priceParts[i];
//         if (pricePart.key == 'subtotal') {
//             return pricePart.value
//         }
//     }

//     return subtotalPricePart.value
// };


// // var methods = function (models) {

// //     this.createCharge = async function (sourceID, autoServiceID, user) {

// //         if (sourceID == null || autoServiceID == null) {
// //             return res.status(422).send();
// //         }

// //         var autoService = await models.AutoService.findById(autoServiceID);
// //         var mechanic = await autoService.getMechanic();
// //         var price = await autoService.getPrice();
// //         var priceParts = await price.getPriceParts();

// //         if (price == null || priceParts == null || mechanic == null || autoService == null) {
// //             return res.status(422).send();
// //         }

// //         const destinationAmount = generateDestinationAmount(priceParts);

// //         return stripe.charges.create({
// //             amount: Math.floor(price.totalPrice),
// //             currency: "usd",
// //             source: sourceID,
// //             customer: user.stripeCustomerID,
// //             description: "Oil Change from Car Swaddle",
// //             statement_descriptor: "Car Swaddle Oil Change",
// //             transfer_data: {
// //                 amount: Math.floor(destinationAmount),
// //                 destination: mechanic.stripeAccountID,
// //             },
// //             receipt_email: user.email,
// //             metadata: {
// //                 mechanicID: mechanic.id,
// //                 userID: user.id,
// //                 priceID: price.id,
// //                 autoServiceID: autoServiceID,
// //             }
// //         });
// //     };

// //     function generateDestinationAmount(priceParts) {
// //         for (var i = 0; i < priceParts.length; i++) {
// //             var pricePart = priceParts[i];
// //             if (pricePart.key == 'subtotal') {
// //                 return pricePart.value
// //             }
// //         }

// //         return subtotalPricePart.value
// //     };

// // };

// // module.exports = methods;
