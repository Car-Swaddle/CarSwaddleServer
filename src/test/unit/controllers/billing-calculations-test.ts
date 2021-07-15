export{}
import { calculatePrices } from "../../../controllers/billing-calculations";
import { assert } from "chai";
import { LocationModel } from "../../../models/location";
import { OilType } from "../../../models/types";
import { CouponModel } from "../../../models/coupon";
import sinon from "sinon";
import { GiftCard, OilChangePricing } from "../../../models";

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
    const fakeLocation: LocationModel = {
        id: "",
        point: {
            coordinates: [0, 0]
        },
        streetAddress: "123 Fake St"
    }

    function createFakeCoupon(): CouponModel {
        return {
            id: "",
            redemptions: 0,
            name: "",
            redeemBy: new Date(),
            discountBookingFee: false,
            isCorporate: true,
        }
    }

    // Mocks
    sinon.stub(OilChangePricing, "findOne").returns(fakePricing);
    let sandbox = sinon.createSandbox();
    this.beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    this.afterEach(() => {
        sandbox.restore();
    });
    

    it("should return correct billing values", async function() {
        const prices = await calculatePrices(fakeMechanic, fakeLocation, OilType.SYNTHETIC, createFakeCoupon());

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
        const coupon: CouponModel = createFakeCoupon();
        coupon.discountBookingFee = true;
        const prices = await calculatePrices(fakeMechanic, fakeLocation, OilType.SYNTHETIC, coupon);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.bookingFee, 660);
        assert.equal(prices.bookingFeeDiscount, -660);
        assert.equal(prices.total, 7325);
    });

    it("should return correct oil change value with booking fee 10% coupon", async function() {
        const coupon: CouponModel = createFakeCoupon();
        coupon.percentOff = .1;
        const prices = await calculatePrices(fakeMechanic, fakeLocation, OilType.SYNTHETIC, coupon);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, -660);
        assert.equal(prices.bookingFee, 594);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.total, 7252);
    });

    it("should return correct oil change value with $90 off coupon", async function() {
        const coupon: CouponModel = createFakeCoupon();
        coupon.amountOff = 9000;
        const prices = await calculatePrices(fakeMechanic, fakeLocation, OilType.SYNTHETIC, coupon);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, -6600);
        assert.equal(prices.bookingFee, 0);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.total, 0);
    });

    it("should return correct oil change value with $90 off coupon + booking fee", async function() {
        const coupon: CouponModel = createFakeCoupon();
        coupon.discountBookingFee = true;
        coupon.amountOff = 9000;
        const prices = await calculatePrices(fakeMechanic, fakeLocation, OilType.SYNTHETIC, coupon);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, -6600);
        assert.equal(prices.bookingFee, 0);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.total, 0)
    });

    it("should return correct oil change value with no coupon", async function() {
        const prices = await calculatePrices(fakeMechanic, fakeLocation, OilType.SYNTHETIC);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, null);
        assert.equal(prices.bookingFee, 660);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.taxes, Math.round((prices.total - prices.taxes) * taxMetadata.rate));
        assert.equal(prices.total, 8054)
    });

    it("should return correct gift card amount and order total", async function() {
        const giftCard = GiftCard.build({
            id: "",
            code: "1234",
            startingBalance: 1000,
            remainingBalance: 500,
        });
        const prices = await calculatePrices(fakeMechanic, fakeLocation, OilType.SYNTHETIC, undefined, [giftCard]);

        assert.equal(prices.oilChange, 6600);
        assert.equal(prices.subtotal, 6600);
        assert.equal(prices.discount, null);
        assert.equal(prices.bookingFee, 660);
        assert.equal(prices.bookingFeeDiscount, null);
        assert.equal(prices.taxes, Math.round((prices.total - prices.taxes) * taxMetadata.rate));
        assert.equal(prices.total, 8054);
        assert.equal(prices.giftCard, -500);
        assert.equal(prices.serviceTotal, 7554);
    });
})
