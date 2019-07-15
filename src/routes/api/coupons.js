const bodyParser = require('body-parser');
const asyncMiddleware = require('../../lib/middleware/async-middleware');

module.exports = function (router, models) {

    const authoritiesController = require('../../controllers/authorities')(models);

    router.delete('/coupons/:id', asyncMiddleware(async function (req, res) {
        const { id } = req.params;

        const [
            coupon,
            editCorporateCarSwaddleCouponAuthory,
            editCarSwaddleCouponAuthory,
        ] = await Promise.all([
            models.Coupon.findById(id),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCorporateCarSwaddleCoupon, false),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false),
        ]);

        const canDelete = coupon && (coupon.createdByUserId === req.user.id || editCorporateCarSwaddleCouponAuthory || editCarSwaddleCouponAuthory);

        if(!coupon || !canDelete) {
            return res.status(403).send('Unable to delete this coupon');
        }

        await coupon.destroy();

        return res.send({ success: true });
    }));

    router.post('/coupons', bodyParser.json(), asyncMiddleware(async function (req, res) {
        const [
            authority,
            authorityCorporate,
        ] = await Promise.all([
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCorporateCarSwaddleCoupon, false),
        ]);

        if(!authority && !authorityCorporate) {
            return res.status(403).send('Permission Denied');
        }

        req.body.id = (req.body.id || '').replace(/\W/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
        req.body.isCorporate = authorityCorporate ? !!req.body.isCorporate : false;
        req.body.createdByUserId = req.user.id;
        req.body.redemptions = 0;

        const coupon = await models.Coupon.create(req.body);

        return res.send({ coupon });
    }));

    router.get('/coupons', asyncMiddleware(async function (req, res) {
        const { skip, limit } = req.query;
        
        const [
            authority,
            authorityCorporate,
        ] = await Promise.all([
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCorporateCarSwaddleCoupon, false),
        ]);

        if(!authority && !authorityCorporate) {
            return res.status(403).send('Permission Denied');
        }

        const coupons = await models.Coupon.findAll({
            where: authorityCorporate ? {} : { userId: req.user.id },
            offset: parseInt(skip || 25, 10) || 0,
            limit: parseInt(limit || 25, 25),
        });

        return res.send({ coupons });
    }));
};
