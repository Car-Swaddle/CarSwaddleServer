const bodyParser = require('body-parser');

const ONE_HOUR = 60 * 60 * 1000; /* ms */
const ONE_DAY = ONE_HOUR * 24;

const MAX_TIME = ONE_DAY;

module.exports = function (app, models) {

    app.get('/email/verify', bodyParser.json(), async function (req, res, next) {
        const id = req.query.id;
        if (id == null) {
            return res.status(400).send('not verified');
        }

        const verification = await models.Verification.findByPk(id);

        if (verification == null || verification.resourceType != 'user' || (+(new Date) - verification.creationDate) > MAX_TIME) {
            return res.status(400).send('not verified');
        }

        const user = await models.User.findByPk(verification.resourceID);

        if (user == null) {
            return res.status(400).send('not verified');
        }

        if (user.isEmailVerified == true) {
            return res.status(400).send('already verified');
        }

        user.isEmailVerified = true;
        user.save().then(user => {
            return res.status(200).end('successfully verified');
        }).catch(err => {
            return res.status(400).send('not verified');
        });
    });

};