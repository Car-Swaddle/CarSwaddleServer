const express = require('express');
const uuidV1 = require('uuid/v1');
const constants = require('../constants');
const bodyParser = require('body-parser');

// All in cents
const centsPerMile = 78;
const oilFilterCents = 950;
const mechanicHourlyRate = 1200;

const conventionalQuartPrice = 300;
const blendQuartPrice = 390;
const syntheticQuartPrice = 440;

const quartsPerOilChange = 5.5;

const metersToMilesConstant = 1609.344;
const haversineR = 6371e3;

// Covers Stripe charge fee %3 and the connect payout volume %0.25 fee 
const stripeProcessPercentage = 0.029;
// in cents
const stripeProcessTransactionFee = 30;

module.exports = function (router, models) {

    router.post('/price', bodyParser.json(), function (req, res) {

        // locationID or location
        // correct oil type 
        // mechanicID

        const body = req.body;

        if (body.oilType == null || body.mechanicID == null || centsForOilType(body.oilType) == null) {
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

        Promise.all(promises).then(values => {
            const location = values[0];
            const mechanic = values[1];

            if (location == null || mechanic == null) {
                return res.status(422).send();
            }

            mechanic.getRegion().then(region => {
                const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
                const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
                const meters = metersBetween(locationPoint, regionPoint);
                const miles = meters / metersToMilesConstant;

                var subtotalPromise = [];

                var laborPrice = models.PricePart.create({
                    key: 'labor', value: (mechanicHourlyRate * 1), id: uuidV1()
                });
                subtotalPromise.push(laborPrice);
                var oilFilterPrice = models.PricePart.create({
                    key: 'oilFilter', value: oilFilterCents, id: uuidV1()
                });
                subtotalPromise.push(oilFilterPrice);
                var distancePrice = models.PricePart.create({
                    key: 'distance', value: ((centsPerMile * miles) * 2), id: uuidV1()
                });
                subtotalPromise.push(distancePrice);
                var oilTypePrice = models.PricePart.create({
                    key: 'oil', value: centsForOilType(oilType), id: uuidV1()
                });
                subtotalPromise.push(oilTypePrice);

                Promise.all(subtotalPromise).then(subPrices => {
                    var prices = [];
                    Array.prototype.push.apply(prices, subPrices);

                    var subtotal = 0;
                    for (var i = 0; i < subPrices.length; i++) {
                        const value = Number(subPrices[i].value);
                        console.log(value);
                        subtotal += value;
                    }

                    var totalPrices = []
                    var subtotalPricePromise = models.PricePart.create({
                        key: 'subtotal', value: subtotal, id: uuidV1()
                    });
                    totalPrices.push(subtotalPricePromise);
                    var bookingFeePricePromise = models.PricePart.create({
                        key: 'bookingFee', value: constants.BOOKING_FEE, id: uuidV1()
                    });
                    totalPrices.push(bookingFeePricePromise);

                    const processingFee = calculateProcessingFee(subtotal);

                    var processingFeePricePromise = models.PricePart.create({
                        key: 'processingFee', value: processingFee, id: uuidV1()
                    });
                    totalPrices.push(processingFeePricePromise);

                    Promise.all(totalPrices).then(totalPrices => {
                        var total = 0;
                        for (var i = 0; i < totalPrices.length; i++) {
                            const value = Number(totalPrices[i].value);
                            console.log(value);
                            total += value;
                        }
                        Array.prototype.push.apply(prices, totalPrices);

                        models.Price.create({ id: uuidV1(), totalPrice: total }).then(price => {
                            price.setPriceParts(prices).then(result => {
                                models.Price.findOne({
                                    where: { id: price.id },
                                    include: [{model: models.PricePart, attributes: ['key', 'value']}]
                                }).then(fullPrice => {
                                    return res.json(fullPrice);
                                });
                            });
                        });
                    });
                });
            });
        });

    });

    function calculateProcessingFee(subtotal) {
        // d = ((s+b)+0.30)/(1-0.029)
        // fee = d - (s+b)
        const total = (subtotal + constants.BOOKING_FEE + stripeProcessTransactionFee) / (1.0 - stripeProcessPercentage);
        return total - (subtotal + constants.BOOKING_FEE);
    }

    function centsForOilType(oilType) {
        var quartPrice = 0.0;
        if (oilType == 'CONVENTIONAL') {
            quartPrice = conventionalQuartPrice;
        } else if (oilType == 'BLEND') {
            quartPrice = blendQuartPrice;
        } else if (oilType == 'SYNTHETIC') {
            quartPrice = syntheticQuartPrice;
        }
        return Number(quartPrice * quartsPerOilChange);
    }

    function metersBetween(point1, point2) {
        const lat1 = point1.latitude;
        const lat2 = point2.latitude;

        const lon1 = point1.longitude;
        const lon2 = point2.longitude;

        var φ1 = degreesToRadians(lat1);
        var φ2 = degreesToRadians(lat2);
        var Δφ = degreesToRadians(lat2 - lat1);
        var Δλ = degreesToRadians(lon2 - lon1);

        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return haversineR * c;
    }

    function degreesToRadians(degrees) {
        var pi = Math.PI;
        return degrees * (pi / 180);
    }

    return router;
};
