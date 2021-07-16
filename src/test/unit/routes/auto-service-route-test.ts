export {}
import supertest from 'supertest';
import { assert } from 'chai';
import sinon from 'sinon';
import { app } from '../../../server';
import { Location, Coupon } from '../../../models';
import { authenticatedPostRequest, stubTestGiftCard, stubTestMechanic, stubTestUser } from '../util';
import { DateTime } from 'luxon';
import Sinon from 'sinon';
import * as billingCalculations from '../../../controllers/billing-calculations';
const { AutoServiceScheduler } = require('../../../controllers/auto-service-scheduler');
const autoService = new AutoServiceScheduler();
const server = app.listen();

describe("Auto service route tests", function() {

    // Mocks
    let sandbox = sinon.createSandbox();
    let request: supertest.SuperTest<supertest.Test>;
    this.beforeAll(() => {
        request = supertest.agent(server);
    })
    this.beforeEach(() => {
        sandbox = sinon.createSandbox();
        stubTestUser(sandbox);
        stubTestMechanic(sandbox);
        stubTestGiftCard(sandbox);
    });
    this.afterEach(() => {
        sandbox.restore();
    });
    this.afterAll(() => {
        server.close();
    })

    it("should handle gift cards", async function() {
        sandbox.stub(Location, "findBySearch").returns(Promise.resolve({}));
        sandbox.stub(Coupon, "findByPk").returns(Promise.resolve({}));
        sandbox.stub(billingCalculations, "calculatePrices").returns(Promise.resolve({
            oilChange: 0,
            distance: 0,
            bookingFee: 0,
            bookingFeeDiscount: null,
            discount: null,
            subtotal: 0,
            processingFee: 0,
            taxes: 0,
            transferAmount: 0,
            mechanicCost: 0,
            total: 10000,
            giftCard: 0,
            serviceTotal: 0,
        }));

        sandbox.stub(autoService.__proto__, "isDateInMechanicSlot").returns(Promise.resolve(true));
        sandbox.stub(autoService.__proto__, "isDatePreviouslyScheduled").returns(Promise.resolve(false));
        const scheduleStub = sandbox.stub(autoService.__proto__, "scheduleAutoService").yields(null, {id: "auto-service-1234"});

        const body = {
            status: "scheduled",
            scheduledDate: DateTime.fromJSDate(new Date()).plus({hours: 24}).toISO(),
            mechanicID: "mechanic-1234",
            serviceEntities: [{entityType: "OIL_CHANGE", specificService: {oilType: "SYNTHETIC"}}],
            locationID: "location-1234",
            giftCardCodes: ["fake-gift-card"],
        }

        const resp = await authenticatedPostRequest(request, "/api/auto-service", body);
        assert.equal(resp.statusCode, 200);
        assert.exists(resp.body);
        assert.equal(resp.body.id, "auto-service-1234");

        Sinon.assert.calledOnce(scheduleStub);
        const call = scheduleStub.getCall(0);
        assert.equal(call.args[0].id, "user-1234");
        assert.equal(call.args[1], "scheduled");
        assert.isNotEmpty(call.args[2]);
        assert.equal(call.args[4], "mechanic-1234");
        assert.exists(call.args[6].total); // Prices
        assert.equal(call.args[7], "SYNTHETIC");
        assert.equal(call.args[10], "location-1234");
        assert.equal(call.args[13][0].code, "fake-gift-card");
    });

});

