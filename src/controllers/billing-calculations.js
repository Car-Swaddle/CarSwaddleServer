const distance = require('../routes/distance');
const constants = require('./constants');

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

function BillingCals(models) {
    this.models = models;
}

BillingCals.prototype.calculateCouponDiscount = function(coupon, subTotal) {
    if(coupon.amountOff) {
        return subTotal > coupon.amountOff ? -coupon.amountOff : -subTotal;
    } else if(coupon.percentOff) {
        return Math.round(subTotal * -coupon.percentOff);
    } else {
        return 0;
    }
}

BillingCals.prototype.calculatePrices = async function(mechanic, location, oilType, coupon, taxRate) {
    const [
        region,
        oilChangePricing,
    ] = await Promise.all([
        mechanic.getRegion(),
        this.models.OilChangePricing.findOne({ where: { mechanicID: mechanic.id } }),
    ]);

    const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
    const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
    const meters = distance.metersBetween(locationPoint, regionPoint);
    const miles = meters / METERS_TO_MILES;

    const centsPerMile = (oilChangePricing && oilChangePricing.centsPerMile) || constants.DEFAULT_CENTS_PER_MILE;
    const oilChangePrice = centsForOilType(oilType, oilChangePricing) || constants.DEFAULT_CENTS_PER_MILE;
    const distancePrice =  Math.round((centsPerMile * miles) * 2);
    const subtotalPrice = oilChangePrice + distancePrice;
    const discountPrice = coupon ? this.calculateCouponDiscount(coupon, subtotalPrice) : null;
    const bookingFeePrice = Math.round(constants.BOOKING_FEE_PERCENTAGE * subtotalPrice);
    const bookingFeeDiscountPrice = coupon && coupon.discountBookingFee ? -bookingFeePrice : null;

    const processingFeePrice = calculateProcessingFee(oilChangePrice, distancePrice, bookingFeePrice, bookingFeeDiscountPrice, taxRate);
    var transferAmountPrice = subtotalPrice;

    if(coupon && coupon.userId) {
        transferAmountPrice += discountPrice;
    }

    return {
        oilChange: oilChangePrice,
        distance: distancePrice,
        bookingFee: bookingFeePrice,
        bookingFeeDiscount: bookingFeeDiscountPrice,
        discount: discountPrice,
        subtotal: subtotalPrice,
        processingFee: processingFeePrice,
        transferAmount: transferAmountPrice,
    };
}

function calculateProcessingFee(oilChange, distance, bookingFee, bookingFeeDiscount, taxRate) {
    // d = ((s+b)+0.30)/(1-0.029)
    // fee = d - (s+b)
    // The mechanic will make a little bit more than what we will take out for the stripeConnectProcessFee because we add
    // the product of the stripeConectFee and the entire total instead of just what the mechanic gets. The profit goes to
    // the mechanic.
    
    // Covers Stripe charge fee %3 and the connect payout volume %0.25 fee 
    const stripeProcessPercentage = 0.029;
    const stripeConnectProcessPercentage = 0.025;
    const stripeProcessTransactionFee = 30; // In Centss

    const feeTotal = (oilChange || 0) + (distance || 0) + (bookingFee || 0) + (bookingFeeDiscount || 0);
    const estimatedTaxes = taxRate ? Math.round(feeTotal * taxRate.rate) : 0;
    const totalPlusTax = feeTotal + estimatedTaxes;

    const connectFee = (totalPlusTax / (1.0 - (stripeConnectProcessPercentage))) - totalPlusTax;
    const basePrice = totalPlusTax + (totalPlusTax * constants.BOOKING_FEE_PERCENTAGE) + connectFee;
    const total = (basePrice + stripeProcessTransactionFee) / (1.0 - (stripeProcessPercentage));

    return Math.round(total - basePrice);
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

module.exports = function (models) {
    return new BillingCals(models);
};
