import { createGiftCard, deleteGiftCard, getGiftCardByCode, getGiftCardByID } from '../../controllers/gift-card-controller';
import { Router, json } from 'express';
import models from '../../models';

const router = Router();

require('./autoService.js')(router, models);
require('./mechanic.js')(router, models);
require('./templateTimeSpan.js')(router, models);
require('./autoService.js')(router, models);
require('./user.js')(router, models);
require('./region.js')(router, models);
require('./mechanic.js')(router, models);
require('./vehicle.js')(router, models);
require('./price')(router, models);
require('./referrer.js')(router, models);
require('./stripe.js')(router, models);
require('./review.js')(router, models);
require('./logout.js')(router, models);
require('./email-verification.js')(router, models);
require('./sms.js')(router, models);
require('./taxes.js')(router, models);
require('./authorities.js')(router, models);
require('./coupons')(router, models);

router.get('/gift-cards/:id', getGiftCardByID);
router.get('/gift-cards/code/:id', getGiftCardByCode)
router.post('/gift-cards', json(), createGiftCard)
router.delete('/gift-cards/:id', json(), deleteGiftCard);

export { router };
