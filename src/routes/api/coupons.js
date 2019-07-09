const bodyParser = require('body-parser');
const uuidV1 = require('uuid/v1');

module.exports = function (router, models) {

    const stripeCharges = require('../../controllers/stripe-charges')(models);
    const authoritiesController = require('../../controllers/authorities')(models);

    router.delete('/coupons/:id', async function (req, res) {
        const { id } = req.params;

        const [
            coupon,
            authority,
        ] = await Promise.all([
            models.Coupon.findById(id),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false),
        ]);

        if(!coupon || (coupon.userId !== req.user.id && !authority)) {
            return res.status(403).send('Unable to delete this coupon');
        }

        await Promise.all([
            coupon.destroy(),
            stripeCharges.removeCoupon(id),
        ]);

        return res.send({ success: true });
    });

    router.post('/coupons', bodyParser.json(), async function (req, res) {
        const authority = await authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false);

        if(!authority) {
            return res.status(403).send('Permission Denied');
        }
        
        if(req.body.id) {
            return res.status(400).send('Unable to update coupons');
        }

        const stripeCoupon = await stripeCharges.createCoupon(req.user.id, req.body);

        const coupon = await models.Coupon.create({
            ...req.body,
            id: stripeCoupon.id,
        });

        return res.send({ coupon });
    });

    router.get('/coupons', async function (req, res) {
        const { skip } = req.query;
        const authority = await authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false);

        if(!authority) {
            return res.status(403).send('Permission Denied');
        }

        const coupons = await models.Coupon.findAll({
            offset: parseInt(skip, 10) || 0,
            limit: 25,
        });

        return res.send({ coupons });
    });
};
