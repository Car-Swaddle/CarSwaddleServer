import { json, Request, Response, Router } from 'express';
import { calculatePrices } from '../../controllers/billing-calculations';
import models, { Coupon } from '../../models';
import { Op } from 'sequelize';
import { CouponModel } from '../../models/coupon';
import { OilType, RedemptionError } from '../../models/types';
import { GiftCardModel } from '../../models/giftCard';
import { findRedeemableGiftCards } from '../../controllers/gift-card-controller';

module.exports = function (router: Router) {
    const stripeChargesFile = require('../../controllers/stripe-charges')(models);
    const taxes = require('../../controllers/taxes')(models);

    interface CodeCheckResponse {
        error?: RedemptionError,
        coupon?: CouponModel,
        giftCard?: GiftCardModel,
        redeemMessage?: string,
    }

    router.get('/price/codes/:code', json(), async function (req: Request<{code: string}, {}, {}, {mechanicID?: string}>, res: Response<CodeCheckResponse>) {
        const code = req.params.code;

        if (!code) {
            return res.status(400).send({ error: RedemptionError.INCORRECT_CODE });
        }

        const giftCardRedeemable = (await findRedeemableGiftCards([code]))[0];
        const {coupon, error: couponError}: {coupon: CouponModel, error: RedemptionError} = await Coupon.findRedeemable(code, req.user.id, req.query.mechanicID);

        if (giftCardRedeemable.giftCard) {
            let giftCard = giftCardRedeemable?.giftCard;
            const noDecimal = giftCard.remainingBalance % 100 === 0;
            return res.send({giftCard, redeemMessage: `$${(giftCard.remainingBalance / 100.0).toFixed(noDecimal ? 0 : 2)} gift card`});
        } else if (coupon) {
            const redeemMessages = [];
            if (coupon.amountOff) {
                const noDecimal = coupon.amountOff % 100 === 0;
                redeemMessages.push(`$${(coupon.amountOff / 100.0).toFixed(noDecimal ? 0 : 2)} off`);
            }
            if (coupon.percentOff) {
                redeemMessages.push(`${(coupon.percentOff * 100.0).toFixed(0)}% off`);
            }
            if (coupon.discountBookingFee) {
                redeemMessages.push("$0 booking fee");
            }
            return res.send({coupon, redeemMessage: redeemMessages.join(', ')});
        }

        let finalError = giftCardRedeemable.error;
        if (couponError != RedemptionError.INCORRECT_CODE) {
            finalError = couponError;
        }
        return res.status(422).send({ error: finalError });
    });

    interface Address {
        longitude: number,
        latitude: number,
        streetAddress: number,
    }

    interface PriceRequest {
        oilType: string,
        mechanicID: string,
        coupon: string,
        giftCardCodes: string[],
        locationID: string,
        vehicleID: string,
        location: Address,
    }

    router.post('/price', json(), async function (req: Request<{}, {}, PriceRequest>, res: Response) {
        const { oilType, mechanicID, coupon, giftCardCodes, locationID, vehicleID, location: address } = req.body;
        const { stripeCustomerID } = req.user;

        if (!oilType || !mechanicID) {
            return res.status(422).send();
        }

        const [
            location,
            mechanic,
            { coupon: requestedCoupon, error: couponError },
            giftCards
        ] = await Promise.all([
            models.Location.findBySearch(locationID, address),
            models.Mechanic.findByPk(mechanicID),
            models.Coupon.findRedeemable(coupon, req.user.id, mechanicID),
            giftCardCodes && giftCardCodes.length ? models.GiftCard.findAll({where: {code: {[Op.in]: giftCardCodes}}}) : Promise.resolve([])
        ]);

        if(coupon && !requestedCoupon) {
            return res.status(422).send({ code: couponError });
        }

        if (location == null || mechanic == null) {
            return res.status(422).send();
        }

        var finalCoupon = requestedCoupon;
        // Only attempt to apply a referrer coupon if they didn't have one
        if (!finalCoupon && req.user.activeReferrerID) {
            const referrer = await models.Referrer.findByPk(req.user.activeReferrerID);

            const referrerRedeemableCoupon = (referrer && referrer.activeCouponID) ? models.Coupon.findRedeemable(referrer.activeCouponID, req.user.id, mechanicID) : null;
            if (referrerRedeemableCoupon) {
                finalCoupon = referrerRedeemableCoupon;
            }
        }

        const prices = await calculatePrices(mechanic, location, oilType as OilType, finalCoupon, giftCards, vehicleID);
        const meta = { oilType, mechanicID, locationID: location.id };

        const taxMetadata = await taxes.taxMetadataForLocation(location);
        await stripeChargesFile.updateDraft(stripeCustomerID, prices, meta, taxMetadata.rate);
        
        return res.json({
            prices,
            location,
        });
    });

    return router;
};
