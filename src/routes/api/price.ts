import { json, Request, Response, Router } from 'express';
import { calculatePrices } from '../../controllers/billing-calculations';
import models from '../../models';
import { GiftCard, Coupon } from '../../models';

module.exports = function (router: Router) {
    const stripeChargesFile = require('../../controllers/stripe-charges')(models);
    const taxes = require('../../controllers/taxes')(models);

    router.get('/codes/:code', json()), async function (req: Request, res: Response) {
        const code = req.params.code;

        // Check for gift card first, then coupon if not found
        const giftCard = await GiftCard.findOne({where: {code: code}});
        if (giftCard) {

        }

        const coupon = await Coupon.findOne({where: {id: code}});
        if (coupon) {
            return res.send({});
        }

        return res.status(422).send({ valid: false, message: "Invalid redemption code" });
    }

    router.post('/price', json(), async function (req: Request, res: Response) {
        const { oilType, mechanicID, coupon, giftCardIDs, locationID, vehicleID, location: address } = req.body;
        const { stripeCustomerID } = req.user;

        if (!oilType || !mechanicID) {
            return res.status(422).send();
        }

        const [
            location,
            mechanic,
            { coupon: requestedCoupon, error: couponError },
        ] = await Promise.all([
            models.Location.findBySearch(locationID, address),
            models.Mechanic.findByPk(mechanicID),
            models.Coupon.findRedeemable(coupon, req.user.id, mechanicID),
        ]);

        if(coupon && !requestedCoupon) {
            return res.status(422).send({ code: couponError });
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

        if (location == null || mechanic == null) {
            return res.status(422).send();
        }

        const prices = await calculatePrices(mechanic, location, oilType, finalCoupon, giftCardIDs, vehicleID);
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
