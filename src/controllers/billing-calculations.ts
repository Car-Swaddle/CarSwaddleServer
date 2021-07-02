import {metersBetween} from "../routes/distance";
import * as models from '../models';
import { OilChangePricing, GiftCard, Coupon } from '../models';
import { VehicleService } from './vehicle';
import * as constants from "./constants";
import { Op } from "sequelize"
const vehicleService = new VehicleService();
const taxService = require('./taxes')(models);

const METERS_TO_MILES = 1609.344;

export function calculateCouponDiscount(coupon: any, subTotal: number) {
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

export interface TaxMetadata {
    id?: string;
    rate: number;
}

export async function calculatePrices(mechanic: any, location: any, oilType: string, couponID?: string, giftCardIDs?: string[], vehicleID?: string) {
    const oilChangePricing = await OilChangePricing.findOne({ where: { mechanicID: mechanic.id } });
    const coupon = couponID ? await Coupon.findByPk(couponID) : null;
    const giftCards = giftCardIDs && giftCardIDs.length ? await GiftCard.findAll({where: {id: {[Op.in]: giftCardIDs}}}) : [];
    const vehicle = vehicleID ? vehicleService.getVehicle(vehicleID) : null;
    const taxMetadata = await taxService.taxMetadataForLocation(location);

    if (!taxMetadata || !taxMetadata.rate) {
        throw "No tax metadata, can't calculate price"
    }

    // If the mechanic doesn't charge for travel, set to 0
    var distancePrice = 0.0;
    if (mechanic.chargeForTravel) {
        const region = await mechanic.getRegion();
        const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
        const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
        const meters = metersBetween(locationPoint, regionPoint);
        const miles = meters / METERS_TO_MILES;
        const centsPerMile = (oilChangePricing && oilChangePricing.centsPerMile) || constants.DEFAULT_CENTS_PER_MILE;
        distancePrice =  Math.round((centsPerMile * miles) * 2);
    }

    const oilChangePrice = centsForOilType(oilType, oilChangePricing, vehicle) || constants.DEFAULT_CONVENTIONAL_PRICE;

    const mechanicBasePrice = oilChangePrice + distancePrice;
    const discountPrice = coupon ? calculateCouponDiscount(coupon, mechanicBasePrice) : null;
    const subtotalPreBookingFee = mechanicBasePrice + (discountPrice || 0);

    const bookingFeePrice = Math.round(constants.BOOKING_FEE_PERCENTAGE * subtotalPreBookingFee);
    const bookingFeeDiscountPrice = coupon && coupon.discountBookingFee && bookingFeePrice ? -bookingFeePrice : null;
    
    const subtotalPrice = subtotalPreBookingFee + bookingFeePrice + (bookingFeeDiscountPrice || 0);
    const { processingFeePrice, salesTax } = calculateProcessingFeeTaxes(subtotalPrice, taxMetadata.rate);
    var mechanicCostPrice = Math.round(mechanicBasePrice * .7);
    var transferAmountPrice = mechanicBasePrice;

    if(coupon && !coupon.isCorporate) {
        transferAmountPrice += discountPrice;
        mechanicCostPrice = Math.round((mechanicBasePrice + discountPrice) * .7)
    }

    console.log("prices metadata: " + JSON.stringify({
        mechanic: mechanic.id,
        location: location,
        oilType: oilType,
        vehicleID: vehicleID,
        coupon: coupon,
        taxMetadata: taxMetadata
    }));

    const total = subtotalPrice + processingFeePrice + salesTax;
    const prices = {
        oilChange: oilChangePrice,
        distance: distancePrice,
        bookingFee: bookingFeePrice,
        bookingFeeDiscount: bookingFeeDiscountPrice,
        discount: discountPrice,
        subtotal: mechanicBasePrice,
        processingFee: processingFeePrice,
        taxes: salesTax,
        transferAmount: transferAmountPrice,
        mechanicCost: mechanicCostPrice,
        total: total,
    };
    console.log("prices: " + JSON.stringify(prices))
    return prices;
}

function calculateProcessingFeeTaxes(subtotal: number, taxRate: number) {
    if (subtotal === 0) {
        return { processingFeePrice: 0, salesTax: 0 };
    }

    // Covers Stripe 2.9% charge rate
    const stripeProcessPercentage = 0.029;
    const stripeProcessTransactionFee = 30; // In cents, per-transaction fee

    const calculateStripeScalingFee = (value: number) => {
        return Math.round(value * stripeProcessPercentage);
    };

    const calculateTax = (value: number) => {
        return Math.round(value * taxRate);
    }

    // Add stripe flat fee to this subtotal so it is included in all the scaling fees/tax
    const subtotalWithTransactionFee = subtotal + stripeProcessTransactionFee;
    const subtotalStripeFee = calculateStripeScalingFee(subtotalWithTransactionFee);

    const initialTaxable = subtotalWithTransactionFee + subtotalStripeFee;
    const initialTaxes = calculateTax(initialTaxable);
    const estimatedTaxStripeFee = calculateStripeScalingFee(initialTaxes);

    // Recalculate taxes with transaction fee included
    // Final transaction fee could be slightly higher because of the additional tax on the stripe transaction but should be minimal/rounding error
    const finalTaxable = initialTaxable + estimatedTaxStripeFee;
    const finalTaxes = calculateTax(finalTaxable);

    const finalProcessingFee = subtotalStripeFee + estimatedTaxStripeFee + stripeProcessTransactionFee;

    console.log("processing fee metadata:" + JSON.stringify({
        subtotal: subtotal,
        subtotalWithTransactionFee: subtotalWithTransactionFee,
        subtotalStripeFee: subtotalStripeFee,
        initialTaxable: initialTaxable,
        initialTaxes: initialTaxes,
        estimatedTaxStripeFee: estimatedTaxStripeFee,
        finalTaxable: finalTaxable,
        finalTaxes: finalTaxes,
        finalProcessingFee: finalProcessingFee
    }));

    return { processingFeePrice: finalProcessingFee, salesTax: finalTaxes }
}

function centsForOilType(oilType: string, oilChangePricing: any, vehicle: any) {
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
