const bodyParser = require('body-parser');
const uuidV1 = require('uuid/v1');


const adminEmail = 'kyle@carswaddle.com';

module.exports = function (router, models) {

    const emailFile = require('../../notifications/email.js');
    const emailer = new emailFile(models);
    const authoritiesControllerFile = require('../../controllers/authorities.js');
    const authoritiesController = new authoritiesControllerFile(models);

    router.post('/authorities/request', bodyParser.json(), function (req, res) {
        const authority = req.query.authority;
        if (!authority) {
            return res.status(404).send('must have authority');
        }
        authoritiesController.createAuthorityRequest(req.user.id, authority, function (err, authorityRequest) {
            // send notification with authorityRequestID
            if (err) {
                return res.status(400).send('unable to send request');
            }
            emailer.sendAuthorityRequestEmailToAdmin(req.user, authorityRequest, function (err) {
                if (!err) {
                    res.status(200).send('sent email');
                } else {
                    res.status(400).send('unable to send email');
                }
            });
        });
    });

    router.post('/authorities/approve', bodyParser.json(), async function (req, res) {
        const email = decodeURIComponent(req.query.email);
        const secretID = req.query.secretID;

        if (!email || !secretID) {
            return res.status(400).send('invalid parameters');
        }
        const user = await models.User.findOne({ where: { email: email } });
        const currentUser = req.user;
        const authorityRequest = await models.AuthorityRequest.findOne({ where: { secretID: secretID } });
        if (!authorityRequest) {
            return res.status(404).send('invalid parameters');
        }
        const authorityConfirmation = await models.AuthorityConfirmation.findOne({ where: { authorityRequestID: authorityRequest.id } });

        if (authorityRequest.expirationDate < new Date()) {
            return res.status(404).send('unable to approve');
        }
        
        // Current user must have authorityApprove authority or the parameter email and user.email == kyle@carswaddle.com
        // authorityRequest must not be expired. 
        // authorityConfirmation must not exist.
        // 

        const editAuthority = await models.Authority.findOne({ 
            where: { userID: user.id, authorityName: models.Authority.NAME.editAuthorities } 
        });

        if (!editAuthority && (currentUser.email != adminEmail && email != adminEmail)) {
            return res.status(403).send('unauthorized');
        }

        if (authorityConfirmation) {
            return res.status(409).send('authority was already confirmed');
        }

        models.AuthorityConfirmation.create({
            id: uuidV1(),
            authorityRequestID: authorityRequest.id,
            status: models.AuthorityConfirmation.STATUS.approved,
            confirmerID: currentUser.id
        }).then(authorityConfirmation => {
            if (!authorityConfirmation) {
                return res.status(400).send('unable to accept');
            } else {
                models.Authority.findOrCreate({
                    where: { authorityName: authorityRequest.authorityName },
                    defaults: {
                        id: uuidV1(),
                        userID: currentUser.id,
                        authorityName: authorityRequest.authorityName
                    }
                }).then(authority, created => {
                    return res.json(authority).send();
                }).catch(err => {
                    return res.status(400).send('unable to accept');
                });
            }
        }).catch(err => {
            res.status(400).send('unable to accept');
        });
    });

    router.post('/authorities/reject', bodyParser.json(), async function (req, res) {
        const email = decodeURIComponent(req.query.email);
        const secretID = req.query.secretID;

        if (!email || !secretID) {
            return res.status(400).send('unable to reject');
        }
        const user = await models.User.findOne({ where: { email: email } });
        const currentUser = req.user;
        const authorityRequest = await models.AuthorityRequest.findOne({ where: { secretID: secretID } });
        if (!authorityRequest) {
            return res.status(404).send('invalid parameters');
        }
        const authorityConfirmation = await models.AuthorityConfirmation.findOne({ where: { authorityRequestID: authorityRequest.id } });

        if (authorityRequest.expirationDate < new Date()) {
            return res.status(404).send('unable to approve');
        }
        
        // Current user must have authorityApprove authority or the parameter email and user.email == kyle@carswaddle.com
        // authorityRequest must not be expired. 
        // authorityConfirmation must not exist.
        // 

        const editAuthority = await models.Authority.findOne({ 
            where: { userID: user.id, authorityName: models.Authority.NAME.editAuthorities } 
        });

        if (!editAuthority && (currentUser.email != adminEmail && email != adminEmail)) {
            return res.status(403).send('unauthorized');
        }

        if (authorityConfirmation) {
            return res.status(409).send('authority confirmation already exists');
        }

        models.AuthorityConfirmation.create({
            id: uuidV1(),
            authorityRequestID: authorityRequest.id,
            status: models.AuthorityConfirmation.STATUS.rejected,
            confirmerID: currentUser.id
        }).then(authorityConfirmation => {
            if (!authorityConfirmation) {
                return res.status(400).send('unable to reject');
            } else {
                return res.status(200).send('successfully rejected');
            }
        }).catch(err => {
            res.status(400).send('unable to reject');
        });
    });

};