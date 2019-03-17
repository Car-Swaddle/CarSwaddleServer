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

// Covers Stripe charge fee %3 and the connect payout volume %0.25 fee 
const stripeProcessPercentage = 0.029;
const stripeConnectProcessPercentage = 0.025;
// in cents
const stripeProcessTransactionFee = 30;

module.exports = function (router, models) {

    router.post('/price', bodyParser.json(), async function (req, res) {

        const body = req.body;

        if (body.oilType == null || body.mechanicID == null) {
            return res.status(422).send();
        }

        const oilType = body.oilType;
        const mechanicID = body.mechanicID;

        var promises = [];
        var locationPromise;
        if (body.locationID != null) {
            locationPromise = models.Location.findById(body.locationID);
            promises.push(locationPromise);
        } else if (body.location != null && body.location.latitude != null && body.location.longitude != null) {
            var point = { type: 'Point', coordinates: [body.location.longitude, body.location.latitude] };
            locationPromise = models.Location.create({
                point: point,
                streetAddress: body.location.streetAddress,
                id: uuidV1(),
            });
            promises.push(locationPromise);
        } else {
            return res.status(422).send();
        }

        var mechanicPromise = models.Mechanic.findById(mechanicID);

        promises.push(mechanicPromise);

        const values = await Promise.all(promises);
        const location = values[0];
        const mechanic = values[1];

        if (location == null || mechanic == null) {
            return res.status(422).send();
        }

        const region = await mechanic.getRegion();
        const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
        const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
        const meters = distance.metersBetween(locationPoint, regionPoint);
        const miles = meters / metersToMilesConstant;

        const oilChangePricing = await models.OilChangePricing.findOne({
            where: {
                mechanicID: mechanic.id
            }
        });

        var centsPerMile = (oilChangePricing && oilChangePricing.centsPerMile) || constants.DEFAULT_CENTS_PER_MILE;
        var oilChangePrice = centsForOilType(oilType, oilChangePricing) || constants.DEFAULT_CENTS_PER_MILE;
        const oilChangeKey = oilChangeKeyForOilType(oilType);

        var subtotalPromise = [];

        var laborPrice = models.PricePart.create({
            key: oilChangeKey, value: Math.round(oilChangePrice), id: uuidV1()
        });
        subtotalPromise.push(laborPrice);
        // var oilFilterPrice = models.PricePart.create({
        //     key: 'oilFilter', value: oilFilterCents, id: uuidV1()
        // });
        // subtotalPromise.push(oilFilterPrice);
        var distancePrice = models.PricePart.create({
            key: 'distance', value: Math.round((centsPerMile * miles) * 2), id: uuidV1()
        });
        subtotalPromise.push(distancePrice);
        // var oilTypePrice = models.PricePart.create({
        //     key: 'oil', value: Math.round(centsForOilType(oilType)), id: uuidV1()
        // });
        // subtotalPromise.push(oilTypePrice);

        const subPrices = await Promise.all(subtotalPromise);
        var prices = [];
        Array.prototype.push.apply(prices, subPrices);

        var subtotal = 0;
        for (var i = 0; i < subPrices.length; i++) {
            const value = Number(subPrices[i].value);
            subtotal += value;
        }

        var totalPricePromises = []
        var subtotalPricePromise = models.PricePart.create({
            key: 'subtotal', value: Math.round(subtotal), id: uuidV1()
        });
        totalPricePromises.push(subtotalPricePromise);
        var bookingFeePricePromise = models.PricePart.create({
            key: 'bookingFee', value: Math.round(constants.BOOKING_FEE_PERCENTAGE * Math.round(subtotal)), id: uuidV1()
        });
        totalPricePromises.push(bookingFeePricePromise);

        const processingFee = calculateProcessingFee(subtotal);

        var processingFeePricePromise = models.PricePart.create({
            key: 'processingFee', value: Math.round(processingFee), id: uuidV1()
        });
        totalPricePromises.push(processingFeePricePromise);

        const totalPrices = await Promise.all(totalPricePromises);
        var total = 0;
        for (var i = 0; i < totalPrices.length; i++) {
            const value = Number(totalPrices[i].value);
            // console.log(value);
            total += value;
        }
        Array.prototype.push.apply(prices, totalPrices);

        const price = await models.Price.create({ id: uuidV1(), totalPrice: Math.round(total) });
        const result = await price.setPriceParts(prices); 
        const fullPrice = await models.Price.findOne({
            where: { id: price.id },
            include: [{ model: models.PricePart, attributes: ['key', 'value'] }]
        });
        return res.json(fullPrice);
    });

    function calculateProcessingFee(subtotal) {
        // d = ((s+b)+0.30)/(1-0.029)
        // fee = d - (s+b)
        // The mechanic will make a little bit more than what we will take out for the stripeConnectProcessFee because we add
        // the product of the stripeConectFee and the entire total instead of just what the mechanic gets. The profit goes to
        // the mechanic.

        var connectFee = subtotal / (1.0 - (stripeConnectProcessPercentage));
        connectFee = connectFee - subtotal;

        const basePrice = subtotal + (subtotal * constants.BOOKING_FEE_PERCENTAGE) + connectFee;
        const total = (basePrice + stripeProcessTransactionFee) / (1.0 - (stripeProcessPercentage));
        return total - basePrice;
    }

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
