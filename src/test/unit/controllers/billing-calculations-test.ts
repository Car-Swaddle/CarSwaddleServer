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
    const taxRate = {
        rate: 0.0715,
    };
    const coupon = {
        discountBookingFee: false,
    }

    it("should return correct billing value", async function() {
        sinon.stub(OilChangePricing, "findOne").returns(fakePricing);
        const billingCalculations = BillingCalculations();
        const out = await billingCalculations.calculatePrices(fakeMechanic, null, "SYNTHETIC", null, coupon, taxRate);
        // TODO - verify these values
        console.log(out);
    });
})
