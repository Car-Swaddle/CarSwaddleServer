const express = require('express');
const uuidV1 = require('uuid/v1');
const constants = require('../../controllers/constants');
const bodyParser = require('body-parser');
const distance = require('../distance.js');

// All in cents
// const centsPerMile = 78;
// const oilFilterCents = 950;
// const mechanicHourlyRate = 1200;

// const bookingFeePercentage = 0.10;

// const conventionalQuartPrice = 300;
// const blendQuartPrice = 390;
// const syntheticQuartPrice = 440;

// const quartsPerOilChange = 5.5;

const metersToMilesConstant = 1609.344;

module.exports = function (router, models) {
    const stripeChargesFile = require('../../controllers/stripe-charges.js')(models);

    async function findLocation({ locationID, location }) {
        if (locationID) {
            return models.Location.findById(locationID);
        } else if (location != null && location.latitude != null && location.longitude != null) {
            return models.Location.create({
                point: {
                    type: 'Point',
                    coordinates: [
                        location.longitude, location.latitude
                    ]
                },
                streetAddress: location.streetAddress,
                id: uuidV1(),
            });
        }
    }

    router.post('/price', bodyParser.json(), async function (req, res) {
        const { oilType, mechanicID, couponCode } = req.body;
        const { stripeCustomerID } = req.user;

        if (!oilType || !mechanicID) {
            return res.status(422).send();
        }

        const [
            location,
            mechanic,
            oilChangePricing,
        ] = await Promise.all([
            findLocation(req.body),
            models.Mechanic.findById(mechanicID),
            models.OilChangePricing.findOne({ where: { mechanicID } }),
        ]);

        if (location == null || mechanic == null) {
            return res.status(422).send();
        }

        const region = await mechanic.getRegion();

        const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
        const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
        const meters = distance.metersBetween(locationPoint, regionPoint);
        const miles = meters / metersToMilesConstant;

        const centsPerMile = (oilChangePricing && oilChangePricing.centsPerMile) || constants.DEFAULT_CENTS_PER_MILE;
        const oilChangePrice = centsForOilType(oilType, oilChangePricing) || constants.DEFAULT_CENTS_PER_MILE;
        const distancePrice =  Math.round((centsPerMile * miles) * 2);
        const subtotalPrice = oilChangePrice + distancePrice;
        const bookingFeePrice = Math.round(constants.BOOKING_FEE_PERCENTAGE * subtotalPrice);
        var transferAmount = subtotalPrice;

        var couponId;
        var bookingFeeDiscount = null;

        if(couponCode) {
            const coupon = models.Coupon.findByCode(couponCode);

            if(coupon) {
                invoiceUpdates.coupon = coupon.id;

                if(coupon.discountBookingFee) {
                    prices.bookingFeeDiscount = -prices.bookingFee;
                }

                // If the coupon is attached to a mechanic's userId then adjust the transferAmount by the coupon amount.
                if(coupon.userId) {
                    if(coupon.percentOff) {
                        transferAmount -= Math.round(transferAmount * coupon.percentOff);
                    } else if(coupon.amountOff) {
                        transferAmount -= coupon.amountOff;
                    }
                }
            }
        }

        const prices = await stripeChargesFile.updateDraft(stripeCustomerID, {
            oilChange: oilChangePrice,
            distance: distancePrice,
            bookingFee: bookingFeePrice,
            bookingFeeDiscount,
            subtotal: subtotalPrice,
        }, {
            oilType,
            mechanicID,
            locationID: location.id,
            transferAmount,
        }, couponId);
        
        return res.json({ prices });
    });

    function oilChangeKeyForOilType(oilType) {
        if (oilType == 'CONVENTIONAL') {
            return 'oilChangeConventional'
        } else if (oilType == 'BLEND') {
            return 'oilChangeBlend'
        } else if (oilType == 'SYNTHETIC') {
            return 'oilChangeSynthetic'
        } else if (oilType == 'HIGH_MILEAGE') {
            return 'oilChangeHighMileage'
        }
    }

    function centsForOilType(oilType, oilChangePricing) {
        if (oilType == 'CONVENTIONAL') {
            return oilChangePricing.conventional || constants.DEFAULT_CONVENTIONAL_PRICE;
        } else if (oilType == 'BLEND') {
            return oilChangePricing.blend || constants.DEFAULT_BLEND_PRICE;
        } else if (oilType == 'SYNTHETIC') {
            return oilChangePricing.synthetic || constants.DEFAULT_SYNTHETIC_PRICE;
        } else if (oilType == 'HIGH_MILEAGE') {
            return oilChangePricing.highMileage || constants.DEFAULT_HIGH_MILEAGE_PRICE;
        }
    }

    // function metersBetween(point1, point2) {
    //     const lat1 = point1.latitude;
    //     const lat2 = point2.latitude;

    //     const lon1 = point1.longitude;
    //     const lon2 = point2.longitude;

    //     var φ1 = degreesToRadians(lat1);
    //     var φ2 = degreesToRadians(lat2);
    //     var Δφ = degreesToRadians(lat2 - lat1);
    //     var Δλ = degreesToRadians(lon2 - lon1);

    //     var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    //         Math.cos(φ1) * Math.cos(φ2) *
    //         Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    //     var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    //     return haversineR * c;
    // }

    // function degreesToRadians(degrees) {
    //     var pi = Math.PI;
    //     return degrees * (pi / 180);
    // }

    return router;
};
