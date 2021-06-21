export{}
const { assert } = require('chai');
const sinon = require("sinon");
const BillingCalculations = require('../../../controllers/billing-calculations');
const { OilChangePricing } = require('../../../models');

describe("Billing Calculations", function() {

    const fakePricing = {
        id: "12345",
        synthetic: 6600,
        syntheticPerQuart: 1320
    }
    const fakeMechanic = {
        id: "12345",
        chargeForTravel: false,
    }
    const taxMetadata = {
        rate: 0.0715,
    };
    sinon.stub(OilChangePricing, "findOne").returns(fakePricing);

    it("should return correct billing values", async function() {
        const coupon = {discountBookingFee: false}
        const billingCalculations = BillingCalculations();
        const prices = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, coupon, taxMetadata);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.bookingFee, 660);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.taxes, Math.round((prices.total - prices.taxes) * taxMetadata.rate));
        // Can be a rounding error here depending on input numbers
        assert.closeTo(prices.processingFee, Math.round((prices.total - prices.processingFee) * 0.029) + 30, 1);
        assert.equal(prices.total, prices.oilChange + prices.bookingFee + prices.taxes + prices.processingFee);
    });

    it("should return correct oil change value no booking fee", async function() {
        const coupon = {discountBookingFee: true};
        const billingCalculations = BillingCalculations();
        const prices = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, coupon, taxMetadata);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.bookingFee, 660);
        assert.equal(prices.bookingFeeDiscount, -660);
        assert.equal(prices.total, 7325);
    });

    it("should return correct oil change value with booking fee 10% coupon", async function() {
        const coupon = {discountBookingFee: false, percentOff: .1};
        const billingCalculations = BillingCalculations();
        const prices = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, coupon, taxMetadata);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, -660);
        assert.equal(prices.bookingFee, 594);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.total, 7252);
    });

    it("should return correct oil change value with $90 off coupon", async function() {
        const coupon = {discountBookingFee: false, amountOff: 9000};
        const billingCalculations = BillingCalculations();
        const prices = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, coupon, taxMetadata);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, -6600);
        assert.equal(prices.bookingFee, 0);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.total, 0);
    });

    it("should return correct oil change value with $90 off coupon + booking fee", async function() {
        const coupon = {discountBookingFee: true, amountOff: 9000};
        const billingCalculations = BillingCalculations();
        const prices = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, coupon, taxMetadata);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, -6600);
        assert.equal(prices.bookingFee, 0);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.total, 0)
    });

    it("should return correct oil change value with no coupon", async function() {
        const billingCalculations = BillingCalculations();
        const prices = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, null, taxMetadata);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, null);
        assert.equal(prices.bookingFee, 660);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.taxes, Math.round((prices.total - prices.taxes) * taxMetadata.rate));
        assert.equal(prices.total, 8054)
    });
})
