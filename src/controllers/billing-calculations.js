const distance = require('../routes/distance');
const constants = require('./constants');
const { OilChangePricing } = require('../models');
const { VehicleService } = require('./vehicle');

// All in cents
// const centsPerMile = 78;
// const oilFilterCents = 950;
// const mechanicHourlyRate = 1200;

// const bookingFeePercentage = 0.10;

// const conventionalQuartPrice = 300;
// const blendQuartPrice = 390;
// const syntheticQuartPrice = 440;

// const quartsPerOilChange = 5.5;

const METERS_TO_MILES = 1609.344;

function BillingCalculations(_) {
    this.vehicleService = new VehicleService();
}

BillingCalculations.prototype.calculateCouponDiscount = function(coupon, subTotal) {
    var discount;

    if(coupon.amountOff) {
        discount = -coupon.amountOff;
    } else if(coupon.percentOff) {
        discount = subTotal * -coupon.percentOff;
    } else {
        discount = 0;
    }

    return Math.max(Math.round(discount), -subTotal);
}

BillingCalculations.prototype.calculatePrices = async function(mechanic, location, oilType, vehicleID, coupon, taxRate) {
    const oilChangePricing = await OilChangePricing.findOne({ where: { mechanicID: mechanic.id } });

    // TODO - if tax rate is 0 or missing, throw?

    // If the mechanic doesn't charge for travel, set to 0
    var distancePrice = 0.0;
    if (mechanic.chargeForTravel) {
        const region = await mechanic.getRegion();
        const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
        const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
        const meters = distance.metersBetween(locationPoint, regionPoint);
        const miles = meters / METERS_TO_MILES;
        const centsPerMile = (oilChangePricing && oilChangePricing.centsPerMile) || constants.DEFAULT_CENTS_PER_MILE;
        distancePrice =  Math.round((centsPerMile * miles) * 2);
    }

    const vehicle = vehicleID ? this.vehicleService.getVehicle(vehicleID) : null;
    const oilChangePrice = centsForOilType(oilType, oilChangePricing, vehicle) || constants.DEFAULT_CONVENTIONAL_PRICE;

    const subtotalPrice = oilChangePrice + distancePrice;
    const discountPrice = coupon ? this.calculateCouponDiscount(coupon, subtotalPrice) : null;
    const bookingFeePrice = Math.round(constants.BOOKING_FEE_PERCENTAGE * subtotalPrice);
    const bookingFeeDiscountPrice = coupon && coupon.discountBookingFee ? -bookingFeePrice : null;

    const processingFeePrice = calculateProcessingFee(oilChangePrice, distancePrice, discountPrice, bookingFeePrice, bookingFeeDiscountPrice, taxRate);
    var mechanicCostPrice = Math.round(subtotalPrice * .7);
    var transferAmountPrice = subtotalPrice;

    if(coupon && !coupon.isCorporate) {
        transferAmountPrice += discountPrice;
        mechanicCostPrice = Math.round((subtotalPrice + discountPrice) * .7)
    }

    const total = discountPrice + oilChangePrice + distancePrice + bookingFeePrice + processingFeePrice + bookingFeeDiscountPrice;
    return {
        oilChange: oilChangePrice,
        distance: distancePrice,
        bookingFee: bookingFeePrice,
        bookingFeeDiscount: bookingFeeDiscountPrice,
        discount: discountPrice,
        subtotal: subtotalPrice,
        processingFee: processingFeePrice,
        transferAmount: transferAmountPrice,
        mechanicCost: mechanicCostPrice,
        total: total,
    };
}

function calculateProcessingFee(oilChange, distance, discountPrice, bookingFee, bookingFeeDiscount, taxRate) {
    // d = ((s+b)+0.30)/(1-0.029)
    // fee = d - (s+b)
    // The mechanic will make a little bit more than what we will take out for the stripeConnectProcessFee because we add
    // the product of the stripeConectFee and the entire total instead of just what the mechanic gets. The profit goes to
    // the mechanic.
    
    // Covers Stripe charge fee %3 and the connect payout volume %0.25 fee
    const stripeProcessPercentage = 0.029;
    const stripeConnectProcessPercentage = 0.0025;
    const calculateStripeScalingFees = (value) => {
        return Math.round((value * stripeProcessPercentage) + (value * stripeConnectProcessPercentage));
    };
    const stripeProcessTransactionFee = 30; // In cents, per-transaction fee

    const calculateTaxes = (value) => {
        return Math.round(value * (taxRate?.rate ?? 0));
    }

    const subtotal = (oilChange || 0) + (distance || 0) + (discountPrice || 0) + (bookingFee || 0) + (bookingFeeDiscount || 0);
    const subtotalStripeFees = calculateStripeScalingFees(subtotal) + stripeProcessTransactionFee;

    const initialTaxable = subtotal + subtotalStripeFees;
    const initialTaxes = calculateTaxes(initialTaxable);
    const estimatedTaxStripeTransactionFee = calculateStripeScalingFees(initialTaxes); // Rough estimate of stripe charges 

    const finalTaxable = initialTaxable + estimatedTaxStripeTransactionFee;
    const finalTaxes = calculateTaxes(finalTaxable);

    return subtotalStripeFees + finalTaxes;

    // const estimatedTaxes = Math.round(feeTotal * taxRate?.rate ?? 0);
    // const totalPlusTax = feeTotal + estimatedTaxes;

    // const connectFee = (totalPlusTax / (1.0 - (stripeConnectProcessPercentage))) - totalPlusTax;
    // const basePrice = totalPlusTax + (totalPlusTax * constants.BOOKING_FEE_PERCENTAGE) + connectFee;
    // const total = (basePrice + stripeProcessTransactionFee) / (1.0 - (stripeProcessPercentage));

    // return Math.round(total - basePrice);
}

function centsForOilType(oilType, oilChangePricing, vehicle) {
    var base;
    var costPerQuart;
    if (oilType == 'CONVENTIONAL') {
        base = oilChangePricing.conventional || constants.DEFAULT_CONVENTIONAL_PRICE;
        costPerQuart = oilChangePricing.conventionalPerQuart || constants.DEFAULT_CONVENTIONAL_PRICE_PER_QUART;
    } else if (oilType == 'BLEND') {
        base = oilChangePricing.blend || constants.DEFAULT_BLEND_PRICE;
        costPerQuart = oilChangePricing.blendPerQuart || constants.DEFAULT_BLEND_PRICE_PER_QUART;
    } else if (oilType == 'SYNTHETIC') {
        base = oilChangePricing.synthetic || constants.DEFAULT_SYNTHETIC_PRICE;
        costPerQuart = oilChangePricing.syntheticPerQuart || constants.DEFAULT_SYNTHETIC_PRICE_PER_QUART;
    } else if (oilType == 'HIGH_MILEAGE') {
        base = oilChangePricing.highMileage || constants.DEFAULT_HIGH_MILEAGE_PRICE;
        costPerQuart = oilChangePricing.highMileagePerQuart || constants.DEFAULT_HIGH_MILEAGE_PRICE_PER_QUART;
    }
    var totalCost = base;
    const quarts = vehicle && vehicle.vehicleDescription && vehicle.vehicleDescription.specs && vehicle.vehicleDescription.specs.quarts ?
        vehicle.vehicleDescription.specs.quarts : constants.DEFAULT_QUARTS_COUNT;
    if (quarts > constants.DEFAULT_QUARTS_COUNT) {
        // Shouldn't be possible, but just in case never allow negative quarts over
        const quartsOver = Math.max(0, quarts - constants.DEFAULT_QUARTS_COUNT);
        totalCost = totalCost + Math.ceil(quartsOver) * costPerQuart;
    }
    return totalCost;
}

module.exports = function (models) {
    return new BillingCalculations(models);
};
