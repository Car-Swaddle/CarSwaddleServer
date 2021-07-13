import { GiftCard } from '../models';
import { GiftCardModel } from '../models/giftCard';
import { RedemptionError } from '../models/types';
import { Op } from 'sequelize';

export interface GiftCardRedeemable {
    code: string;
    giftCard?: GiftCardModel;
    error?: RedemptionError;
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

