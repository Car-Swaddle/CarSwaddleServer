export {}
import supertest from 'supertest';
import { assert } from 'chai';
import sinon, { SinonStub } from 'sinon';
import { Coupon, GiftCard, User } from "../../../models";
import { GiftCardModel } from "../../../models/giftCard";
import { FindOptions } from "sequelize";
import { RedemptionError } from '../../../models/types';
import { app } from '../../../server';
const server = app.listen();

describe("Billing Calculations", function() {

    // Mocks
    let sandbox = sinon.createSandbox();
    let request: supertest.SuperTest<supertest.Test>;
    this.beforeAll(() => {
        request = supertest.agent(server);
    })
    this.beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(User, "findByPk").returns(Promise.resolve({
            id: 1234,
        }));
    });
    this.afterEach(() => {
        sandbox.restore();
    });
    this.afterAll(() => {
        server.close();
    })

    // signed jwt from {id: 1234}
    const testJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzNCwiaWF0IjoxNjI1NjM0MjA4fQ.H_G3UD5wY7bu9sImz7WzMgDLgqxKT0BbuxX1kW9VBdo";

    it("should return gift card with description", async function() {
        const giftCardStub = sandbox.stub(GiftCard, "findOne") as SinonStub<[options?: FindOptions<any> | undefined], Promise<GiftCardModel | null>>;
        giftCardStub.returns(Promise.resolve(GiftCard.build({
            id: "1234",
            code: "fake-gift-card",
            startingBalance: 10_000,
            remainingBalance: 5_000
        })));

        const resp = await (request.get("/api/price/codes/fake-gift-card").auth(testJWT, {type: "bearer"}));
        assert.exists(resp.body.giftCard, "Missing gift card");
        assert.equal(resp.body.giftCard.remainingBalance, 5_000, "Mismatched remaining balance");
        assert.equal(resp.body.redeemMessage, "$50 gift card")
    });

    it("should return coupon with % description", async function() {
        sandbox.stub(GiftCard, "findOne").returns(Promise.resolve(null));
        sandbox.stub(Coupon, "findRedeemable").returns(Promise.resolve({coupon: {
            id: "fake-coupon-amount",
            percentOff: 0.10,
        }}));

        const resp = await (request.get("/api/price/codes/fake-coupon").auth(testJWT, {type: "bearer"}));
        assert.exists(resp.body.coupon, "Missing coupon");
        assert.equal(resp.body.coupon.percentOff, 0.10, "Mismatched percent off");
        assert.equal(resp.body.redeemMessage, "10% off")
    });

    it("should return coupon with $ description", async function() {
        sandbox.stub(GiftCard, "findOne").returns(Promise.resolve(null));
        sandbox.stub(Coupon, "findRedeemable").returns(Promise.resolve({coupon: {
            id: "fake-coupon-amount",
            amountOff: 1000,
        }}));

        const resp = await (request.get("/api/price/codes/fake-coupon-amount").auth(testJWT, {type: "bearer"}));
        assert.exists(resp.body.coupon, "Missing coupon");
        assert.equal(resp.body.coupon.amountOff, 1000, "Mismatched amount off");
        assert.equal(resp.body.redeemMessage, "$10 off")
    });

    it("should return coupon with error", async function() {
        sandbox.stub(GiftCard, "findOne").returns(Promise.resolve(null));
        sandbox.stub(Coupon, "findRedeemable").returns(Promise.resolve({error: RedemptionError.INCORRECT_CODE}));
        
        const resp = await (request.get("/api/price/codes/fake-coupon-amount").auth(testJWT, {type: "bearer"}));
        assert.notExists(resp.body.coupon, "Should have no coupon");
        assert.notExists(resp.body.giftCard, "Should have no coupon");
        assert.equal(resp.body.error, RedemptionError.INCORRECT_CODE, "Mismatched error code");
    });
});

