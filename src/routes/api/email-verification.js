const bodyParser = require('body-parser');


module.exports = function (app, models) {

    const emailFile = require('../../notifications/email.js');
    const emailer = new emailFile(models);
    
    app.get('/email/send-verification', bodyParser.json(), async function (req, res, next) {
        if (req.user == null) {
            return res.status(400).send();
        }
        emailer.sendEmailVerificationEmail(req.user, function (err) {
            if (err == null) {
                res.status(200).json({
                    'email': req.user.email
                });
            } else {
                res.status(400).send();
            }
        });
    });

};

