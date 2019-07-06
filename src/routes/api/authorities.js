const bodyParser = require('body-parser');
const uuidV1 = require('uuid/v1');


const adminEmail = 'kyle@carswaddle.com';

module.exports = function (router, models) {

    const emailFile = require('../../notifications/email.js');
    const emailer = new emailFile(models);
    const authoritiesControllerFile = require('../../controllers/authorities.js');
    const authoritiesController = new authoritiesControllerFile(models);

    router.post('/authorities/request', bodyParser.json(), function (req, res) {
        const authority = req.body.authority;
        if (!authority) {
            return res.status(404).send('must have authority');
        }
        authoritiesController.createAuthorityRequest(req.user.id, authority, function (err, authorityRequest) {
            // send notification with authorityRequestID
            if (err) {
                return res.status(400).send('unable to request authority');
            }
            emailer.sendAuthorityRequestEmailToAdmin(req.user, authorityRequest, function (err) {
                if (!err) {
                    res.status(200).json(authorityRequest);
                } else {
                    res.status(400).send('unable to send email');
                }
            });
        });
    });

    router.post('/authorities/approve', bodyParser.json(), async function (req, res) {
        const secretID = req.body.secretID;

        if (!secretID) {
            return res.status(400).send('invalid parameters');
        }
        const currentUser = req.user;
        const authorityRequest = await models.AuthorityRequest.findOne({ where: { secretID: secretID } });
        if (!authorityRequest) {
            return res.status(404).send('invalid parameters');
        }
        const authorityConfirmation = await models.AuthorityConfirmation.findOne({ where: { authorityRequestID: authorityRequest.id } });

        if (authorityRequest.expirationDate < new Date()) {
            return res.status(404).send('Request is expired');
        }

        // Current user must have authorityApprove authority or currentUser.email == adminEmail
        // authorityRequest must not be expired. 
        // authorityConfirmation must not exist.

        const editAuthority = await models.Authority.findOne({
            where: { userID: currentUser.id, authorityName: models.Authority.NAME.editAuthorities }
        });

        if (!editAuthority && (currentUser.email != adminEmail)) {
            return res.status(403).send('unauthorized');
        }

        if (authorityConfirmation) {
            return res.status(409).send('authority was already confirmed');
        }

        const existingAuthority = await models.Authority.findOne({
            where: { userID: currentUser.id, authorityName: authorityRequest.authorityName }
        });

        if (existingAuthority) {
            return res.status(409).send('authority already exists');
        }

        const self = this;
        models.AuthorityConfirmation.create({
            id: uuidV1(),
            authorityRequest: authorityRequest,
            status: models.AuthorityConfirmation.STATUS.approved,
        }).then(async authorityConfirmation => {
            authorityConfirmation.setUser(currentUser, { save: false });
            authorityRequest.setAuthorityConfirmation(authorityConfirmation, { save: false });

            await authorityConfirmation.save();
            if (!authorityConfirmation) {
                return res.status(400).send('unable to accept');
            } else {
                models.Authority.findOrCreate({
                    where: { authorityName: authorityRequest.authorityName },
                    defaults: {
                        id: uuidV1(),
                        authorityName: authorityRequest.authorityName
                    }
                }).then(async ([authority, created]) => {
                    authority.setUser(currentUser, { save: false });
                    authority.setAuthorityConfirmation(authorityConfirmation, { save: false });
                    authority.setAuthorityRequest(authorityRequest, { save: false });
                    await authority.save();
                    models.AuthorityConfirmation.findById(authorityConfirmation.id, {
                        include: [{
                            model: models.User, attributes: models.User.defaultAttributes
                        }, {
                            model: models.Authority
                        }]
                    }).then(authorityConfirmation => {
                        return res.json(authorityConfirmation).send();
                    }).catch(err => {
                        return res.status(400).send();
                    });
                }).catch(err => {
                    return res.status(400).send('unable to accept');
                });
            }
        }).catch(err => {
            res.status(400).send('unable to accept');
        });
    });

    router.post('/authorities/reject', bodyParser.json(), async function (req, res) {
        const secretID = req.body.secretID;

        if (!secretID) {
            return res.status(400).send('unable to reject');
        }
        const currentUser = req.user;
        const authorityRequest = await models.AuthorityRequest.findOne({ where: { secretID: secretID } });
        if (!authorityRequest) {
            return res.status(404).send('invalid parameters');
        }
        const authorityConfirmation = await models.AuthorityConfirmation.findOne({ where: { authorityRequestID: authorityRequest.id } });

        if (authorityRequest.expirationDate < new Date()) {
            return res.status(404).send('unable to approve expired request');
        }

        // Current user must have authorityApprove authority or currentUser.email == adminEmail
        // authorityRequest must not be expired. 
        // authorityConfirmation must not exist.

        const editAuthority = await models.Authority.findOne({
            where: { userID: currentUser.id, authorityName: models.Authority.NAME.editAuthorities }
        });

        if (!editAuthority && currentUser.email != adminEmail) {
            return res.status(403).send('unauthorized');
        }

        if (authorityConfirmation) {
            return res.status(409).send('authority confirmation already exists');
        }

        models.AuthorityConfirmation.create({
            id: uuidV1(),
            status: models.AuthorityConfirmation.STATUS.rejected,
        }).then(async authorityConfirmation => {
            authorityConfirmation = await authorityConfirmation.setUser(req.user, { save: true });
            if (!authorityConfirmation) {
                return res.status(400).send('unable to reject');
            } else {
                await authorityRequest.setAuthorityConfirmation(authorityConfirmation, { save: true });
                models.AuthorityConfirmation.findById(authorityConfirmation.id, {
                    include: [{
                        model: models.User, attributes: models.User.defaultAttributes
                    }, {
                        model: models.AuthorityRequest, attributes: models.AuthorityRequest.defaultAttributes
                    }]
                }).then(confirmation => {
                    return res.json(confirmation).send();
                }).catch(err => {
                    return res.status(400).send();
                })
            }
        }).catch(err => {
            res.status(400).send('unable to reject');
        });
    });

    router.get('/authorities', async function (req, res) {
        // gets all authorities sorted by creationDate, 
        // return requestConfirmation as well for who confirmed the authority and when it happened
        // paged

        try {
            const authority = await authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.readAuthorities);

            if (!authority) {
                return res.status(403).send('unauthorized to view authorities');
            }

            authoritiesController.fetchAuthorities(req.query.limit || 30, req.query.offset || 0, function (err, authorities) {
                if (err) {
                    return res.status(400).send('error fetching authorities');
                } else {
                    return res.status(200).json(authorities);
                }
            });
        } catch(e) {
            res.status(400).send('unable to determine access');
        }
    });

    router.get('/authorityRequests', bodyParser.json(), async function (req, res) {
        // gets all authority requests sorted by creationDate
        // paged

        authoritiesController.fetchAuthorityRequests(req.query.limit || 30, req.query.offset || 0, req.query.pending || false, req.user.id, function (err, authorityRequests) {
            if (err) {
                return res.status(400).send('error fetching authorities');
            } else {
                return res.status(200).json(authorityRequests);
            }
        });
    });

    router.get('/authorities/user', bodyParser.json(), async function (req, res) {
        authoritiesController.fetchAuthoritiesForUser(req.user.id, function (err, authorities) {
            if (err) {
                return res.status(400).send('error fetching authorities');
            } else {
                return res.status(200).json(authorities);
            }
        });
    });

};
