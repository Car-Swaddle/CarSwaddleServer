import models, { GiftCard } from '../models';
import { GiftCardModel } from '../models/giftCard';
import { RedemptionError } from '../models/types';
import { Op } from 'sequelize';
import { NextFunction, Request, Response } from 'express';
import { body, param, ValidationError, validationResult } from 'express-validator';
import { v4 } from 'uuid';
const authoritiesController = require('./authorities')(models);

export interface GiftCardRedeemable {
    code: string;
    giftCard?: GiftCardModel;
    error?: RedemptionError;
}

async function checkEditAuthority(req: Request, res: Response) {
    await authoritiesController.checkAuthority(req, res, models.Authority.NAME.editCarSwaddleCoupon);
}

function handleValidationErrors(req: Request) {
    const errors = validationResult(req).formatWith((error: ValidationError) => {
        // "code: Invalid value"
        return `${error.param}: ${error.msg}`;
    });
    if (!errors.isEmpty()) {
        throw new Error(errors.array().join(', '));
    }
}

export async function getGiftCardByID(req: Request<{id: string}, GiftCardModel | null>, res: Response, next: NextFunction) {
    try {
        await param("id").isInt().run(req);
        handleValidationErrors(req);

        const giftCard = await GiftCard.findByPk(req.params.id);
        return res.json(giftCard);
    } catch (e) {
        next(e);
    }
}

export async function getGiftCardByCode(req: Request<{code: string}, GiftCardModel | null>, res: Response, next: NextFunction) {
    try {
        await param("code").isInt().run(req);
        handleValidationErrors(req);

        const giftCard = await GiftCard.findOne({where: {code: req.params.code}})
        return res.json(giftCard);
    } catch (e) {
        next(e);
    }
}

export async function createGiftCard(req: Request<{}, GiftCardModel, GiftCardModel>, res: Response, next: NextFunction) {
    try {
        await body("code").isString().run(req);
        await body("startingBalance").isInt().run(req);
        await body("remainingBalance").optional().isInt({max: req.body?.startingBalance ?? 0}).run(req);
        await body("expiration").isString().toDate().run(req);
        handleValidationErrors(req);
    
        await checkEditAuthority(req, res);
    
        const toCreate = req.body;
        toCreate.id = v4();
        if (!toCreate.remainingBalance) {
            toCreate.remainingBalance = toCreate.startingBalance;
        }
        const created = await GiftCard.create(req.body);
        return res.json(created);
    } catch (e) {
        next(e);
    }
}

export async function deleteGiftCard(req: Request<{id: string}>, res: Response, next: NextFunction) {
    try {
        await param("id").isInt().run(req);
        handleValidationErrors(req);

        await checkEditAuthority(req, res);

        const giftCard = await GiftCard.findByPk(req.params.id);
        if (!giftCard) {
            return next("Invalid gift card id");
        }
        if (giftCard?.remainingBalance > 0) {
            console.info(`Deleting gift card ${giftCard?.id} with remaining balance $${giftCard?.remainingBalance / 100.0}`);
        }
        await GiftCard.destroy()
        return res.sendStatus(204);
    } catch (e) {
        next(e);
    }
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

