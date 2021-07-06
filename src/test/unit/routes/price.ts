export {}
import supertest from 'supertest';
import chai from 'chai';
import sinon, { SinonStub } from 'sinon';
import { GiftCard } from "../../../models";
import { GiftCardModel } from "../../../models/giftCard";
import { FindOptions } from "sequelize";
const app = require("../../../server");
const request = supertest(app);

describe("Billing Calculations", function() {

    // Mocks
    let sandbox = sinon.createSandbox();
    this.beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    this.afterEach(() => {
        sandbox.restore();
    });
    

    // TODO - mock authentication to provide values
    it("should return gift card with description", async function() {
        const stub = sinon.stub(GiftCard, "findOne") as SinonStub<[options?: FindOptions<any> | undefined], Promise<GiftCardModel | null>>;
        stub.returns(Promise.resolve(GiftCard.build({
            id: "1234",
            code: "asdf123",
            startingBalance: 100_000,
            remainingBalance: 50_000
        })));

        const resp = await request.get("/api/codes/asdf123");
        chai.assert(resp.body.giftCard, "Missing gift card");
    });

    it("should return coupon with description", async function() {
        
    });

    it("should return coupon with error", async function() {
        
    });
});

