import models, { GiftCard } from '../models';
import { GiftCardModel } from '../models/giftCard';
import { RedemptionError } from '../models/types';
import { Op } from 'sequelize';
import { NextFunction, Request, Response } from 'express';
const authoritiesController = require('../../controllers/authorities')(models);

export interface GiftCardRedeemable {
    code: string;
    giftCard?: GiftCardModel;
    error?: RedemptionError;
}

async function checkEditAuthority(req: Request, res: Response) {
    await authoritiesController.checkAuthority(req, res, models.Authority.NAME.editCarSwaddleCoupon);
}

export async function getGiftCardByID(req: Request<{id: string}, GiftCardModel | null>, res: Response, next: NextFunction) {
    // assert id exists
    return GiftCard.findByPk();
}

export async function getGiftCardByCode(req: Request<{code: string}, GiftCardModel | null>, res: Response, next: NextFunction) {
    // assert code exists
    return GiftCard.findOne({where: {code: code}});
}

export async function createGiftCard(req: Request<{}, GiftCardModel, GiftCardModel>, res: Response, next: NextFunction) {
    await checkEditAuthority(req, res);
    // Check all fields
}

export async function deleteGiftCard(req: Request<{id: string}>, res: Response, next: NextFunction) {
    await checkEditAuthority(req, res);
    // check for id

    const giftCard = await GiftCard.findByPk(req.params.id);
    if (!giftCard) {
        return next("Invalid gift card id");
    }
    GiftCard.destroy()
}

export async function findRedeemableGiftCards(giftCardCodes: string[]): Promise<GiftCardRedeemable[]> {
    if (!giftCardCodes?.length) {
        return Promise.resolve([]);
    }
    const giftCards = await GiftCard.findAll({where: {code: {[Op.in]: giftCardCodes}}});

    let redeemableDict: {[code: string]: GiftCardRedeemable} = {};

    for (let giftCard of giftCards) {
        let giftCardError;
        if (giftCard.expiration && giftCard.expiration.getTime() < Date.now()) {
            giftCardError = RedemptionError.EXPIRED;
        } else if (giftCard.remainingBalance <= 0) {
            giftCardError = RedemptionError.DEPLETED_REDEMPTIONS;
        }
        redeemableDict[giftCard.code] = {code: giftCard.code, giftCard: giftCardError ? undefined : giftCard, error: giftCardError}
    }

    // Fill with unmatched codes
    for (let giftCardCode of giftCardCodes) {
        if (giftCardCode in redeemableDict) {
            continue;
        }
        redeemableDict[giftCardCode] = {code: giftCardCode, error: RedemptionError.INCORRECT_CODE};
    }

    return Promise.resolve(Object.values(redeemableDict));
}

