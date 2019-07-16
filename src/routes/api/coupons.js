const bodyParser = require('body-parser');
const asyncMiddleware = require('../../lib/middleware/async-middleware');

module.exports = function (router, models) {

    const authoritiesController = require('../../controllers/authorities')(models);

    router.delete('/coupons/:id', asyncMiddleware(async function (req, res) {
        const { id } = req.params;

        const [
            coupon,
            editCarSwaddleCouponAuthory,
        ] = await Promise.all([
            models.Coupon.findById(id),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false),
        ]);

        const canDelete = coupon && (coupon.createdByUserID === req.user.id || editCarSwaddleCouponAuthory);

        if(!coupon || !canDelete || coupon.redemptions > 0) {
            return res.status(403).send('Unable to delete this coupon');
        }

        await coupon.destroy();

        return res.send({ success: true });
    }));

    router.post('/coupons', bodyParser.json(), asyncMiddleware(async function (req, res) {
        const [
            authority,
            mechanic,
        ] = await Promise.all([
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false),
            req.user.getMechanic(),
        ]);

        if(!authority && !mechanic) {
            return res.status(403).send('Permission Denied');
        }

        req.body.id = (req.body.id || '').replace(/\W/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
        req.body.isCorporate = !!authority;
        req.body.createdByUserID = req.user.id;
        req.body.createdByMechanicID = authority ? null : mechanic.id;
        req.body.redemptions = 0;

        const coupon = await models.Coupon.create(req.body);

        return res.send({ coupon });
    }));

    router.get('/coupons', asyncMiddleware(async function (req, res) {
        const { skip, limit } = req.query;
        
        const [
            authority,
        ] = await Promise.all([
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.readCarSwaddleCoupon, false),
        ]);

        if(!authority) {
            return res.status(403).send('Permission Denied');
        }

        const coupons = await models.Coupon.findAll({
            where: {},
            offset: parseInt(skip, 10) || 0,
            limit: parseInt(limit, 10) || 25,
        });

        return res.send({ coupons });
    }));
};
