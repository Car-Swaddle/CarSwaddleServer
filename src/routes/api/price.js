const express = require('express');
const constants = require('../../controllers/constants');
const bodyParser = require('body-parser');
const distance = require('../distance.js');

module.exports = function (router, models) {
    const stripeChargesFile = require('../../controllers/stripe-charges')(models);
    const billingCalculations = require('../../controllers/billing-calculations')(models);
    const taxes = require('../../controllers/taxes')(models);

    router.post('/price', bodyParser.json(), async function (req, res) {
        const { oilType, mechanicID, coupon, locationID, vehicleID, location: address } = req.body;
        const { stripeCustomerID } = req.user;

        if (!oilType || !mechanicID) {
            return res.status(422).send();
        }

        const [
            location,
            mechanic,
            { coupon: requestedCoupon, error: couponError },
        ] = await Promise.all([
            models.Location.findBySearch(locationID, address),
            models.Mechanic.findByPk(mechanicID),
            models.Coupon.findRedeemable(coupon, mechanicID),
        ]);

        if(coupon && !requestedCoupon) {
            return res.status(422).send({ code: couponError });
        }

        var finalCoupon = requestedCoupon;
        // Only attempt to apply a referrer coupon if they didn't have one
        if (!finalCoupon && req.user.activeReferrerID) {
            const referrer = await models.Referrer.findByPk(req.user.activeReferrerID, {
                include: [
                    {model: models.Coupon},
                ] 
            });

            const referrerRedeemableCoupon = models.Coupon.findRedeemable(referrer.activeCouponID, mechanicID);
            if (referrerRedeemableCoupon) {
                finalCoupon = referrerRedeemableCoupon;
            }
        }

        if (location == null || mechanic == null) {
            return res.status(422).send();
        }

        const taxRate = await taxes.taxRateForLocation(location);
        const prices = await billingCalculations.calculatePrices(mechanic, location, oilType, vehicleID, finalCoupon, taxRate);
        const meta = { oilType, mechanicID, locationID: location.id };

        await stripeChargesFile.updateDraft(stripeCustomerID, prices, meta, taxRate);
        
        return res.json({
            prices,
            location,
        });
    });

    function oilChangeKeyForOilType(oilType) {
        if (oilType == 'BLEND') {
            return 'oilChangeBlend'
        } else if (oilType == 'SYNTHETIC') {
            return 'oilChangeSynthetic'
        } else if (oilType == 'HIGH_MILEAGE') {
            return 'oilChangeHighMileage'
        } else {
            // Conventional, default
            return 'oilChangeConventional'
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
