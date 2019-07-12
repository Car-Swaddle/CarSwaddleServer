const bodyParser = require('body-parser');
const asyncMiddleware = require('../../lib/middleware/async-middleware');

module.exports = function (router, models) {

    const authoritiesController = require('../../controllers/authorities')(models);

    router.delete('/coupons/:id', asyncMiddleware(async function (req, res) {
        const { id } = req.params;

        const [
            coupon,
            authority,
            authorityCorporate,
        ] = await Promise.all([
            models.Coupon.findById(id),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCarSwaddleCoupon, false),
            authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editCorporateCarSwaddleCoupon, false),
        ]);

        const canDelete = coupon && ((!coupon.userId && authorityCorporate) || (coupon.userId && coupon.userId === req.user.id && authority));

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

        const couponUserID = authorityCorporate ? null : req.user.id;
        const coupon = await models.Coupon.create({
            ...req.body,
            userID: couponUserID,
            redemptions: 0,
        });

        return res.send({ coupon });
    }));

    router.get('/coupons', asyncMiddleware(async function (req, res) {
        const { skip } = req.query;
        
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
            offset: parseInt(skip, 10) || 0,
            limit: 25,
        });

        return res.send({ coupons });
    }));
};
