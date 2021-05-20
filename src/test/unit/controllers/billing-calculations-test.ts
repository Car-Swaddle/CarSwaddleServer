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
    const coupon = {
        discountBookingFee: false,
    }

    it("should return correct billing value", async function() {
        sinon.stub(OilChangePricing, "findOne").returns(fakePricing);
        const billingCalculations = BillingCalculations();
        const prices = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, coupon, taxMetadata);
        
        console.log(prices);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.bookingFee, 660);
        assert.equal(prices.salesTax, Math.round((prices.total - prices.salesTax) * taxMetadata.rate));
        assert.equal(prices.processingFee, Math.round((prices.total - 30) * 0.0315));
        // assert.equal(prices.total, 8075);
    });
})
