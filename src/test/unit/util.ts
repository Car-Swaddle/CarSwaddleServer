import supertest from 'supertest';
import { SinonSandbox, SinonStub } from 'sinon';
import { User, Mechanic, GiftCard } from '../../models';
import { GiftCardModel } from '../../models/giftCard';
import { FindOptions } from 'sequelize';

// signed jwt from {id: 1234}
export const TEST_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzNCwiaWF0IjoxNjI1NjM0MjA4fQ.H_G3UD5wY7bu9sImz7WzMgDLgqxKT0BbuxX1kW9VBdo";

export function stubTestUser(sandbox: SinonSandbox) {
    sandbox.stub(User, "findByPk").returns(Promise.resolve({
        id: "user-1234",
    }));
}

export function stubTestUserWithReferrer(sandbox: SinonSandbox) {
    sandbox.stub(User, "findByPk").returns(Promise.resolve({
        id: "user-2345",
        activeReferrerID: "ref-1234"
    }));
}

export function stubTestMechanic(sandbox: SinonSandbox) {
    sandbox.stub(Mechanic, "findByPk").returns(Promise.resolve({
        id: "mechanic-1234",
    }));
}

export function stubTestGiftCard(sandbox: SinonSandbox) {
    const giftCardStub = sandbox.stub(GiftCard, "findOne") as SinonStub<[options?: FindOptions<any> | undefined], Promise<GiftCardModel | null>>;
    const giftCardStub2 = sandbox.stub(GiftCard, "findAll") as SinonStub<[options?: FindOptions<any> | undefined], Promise<GiftCardModel[]>>;
    const fakeGiftCard = GiftCard.build({
        id: "gift-card-1234",
        code: "fake-gift-card",
        startingBalance: 10_000,
        remainingBalance: 5_000
    });
    giftCardStub.returns(Promise.resolve(fakeGiftCard));
    giftCardStub2.returns(Promise.resolve([fakeGiftCard]));
}

export async function authenticatedGetRequest(request: supertest.SuperTest<supertest.Test>, path: string) {
    return (request.get(path).auth(TEST_JWT, {type: "bearer"}));
}

export async function authenticatedPostRequest(request: supertest.SuperTest<supertest.Test>, path: string, body?: object) {
    return (request.post(path).send(body).auth(TEST_JWT, {type: "bearer"}));
}
