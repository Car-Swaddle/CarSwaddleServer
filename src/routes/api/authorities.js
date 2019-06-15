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
            return res.status(404).send('unable to approve');
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
            // authorityConfirmation.confirmerID = currentUser.id;
            authorityConfirmation.setUser(currentUser, { save: false });
            // authorityConfirmation.setAuthorityRequest(authorityRequest, { save: false });
            authorityRequest.setAuthorityConfirmation(authorityConfirmation, { save: false });
            // authorityConfirmation.authorityRequestID = authorityRequest.id;

            await authorityConfirmation.save();
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
                }).then(([authority, created]) => {
                    // authority.setAuthorityConfirmation(authorityConfirmation, { save: false });
                    authorityConfirmation.setAuthority(authority, { save: false });
                    authorityConfirmation.save().then(newAuthorityConfirmation => {
                        models.AuthorityConfirmation.findById(authorityConfirmation.id, {
                            include: [{
                                model: models.User, attributes: models.User.defaultAttributes
                            },{
                                model: models.Authority
                            }]
                        }).then(confirmation => {
                            return res.json(confirmation).send();
                        }).catch(err => {
                            return res.status(400).send();
                        })
                    }).catch(err => {
                        return res.status(400).send('unable to accept');
                    })
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
            return res.status(404).send('unable to approve');
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
                authorityRequest.setAuthorityConfirmation(authorityConfirmation, { save: false });
                authorityConfirmation.set
                // authorityRequest.confirmerID = req.user.id;
                // authorityConfirmation.setUser(req.user, { save: false });
                // req.user.setAuthorityConfirmation(authorityConfirmation, { save: false });
                authorityRequest.save().then(request => {
                    models.AuthorityConfirmation.findById(authorityConfirmation.id, {
                        include: [{
                            model: models.User, attributes: models.User.defaultAttributes
                        }, {
                            model: models.AuthorityRequest
                        }]
                    }).then(confirmation => {
                        return res.json(confirmation).send();
                    }).catch(err => {
                        return res.status(400).send();
                    })
                }).catch(err => {
                    return res.status(400);
                })
            }
        }).catch(err => {
            res.status(400).send('unable to reject');
        });
    });

    router.get('/authorities', bodyParser.json(), async function (req, res) {
        // gets all authorities sorted by creationDate, 
        // return requestConfirmation as well for who confirmed the authority and when it happened
        // paged

        const self = this;
        authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.readAuthorities, function (err, authority) {
            if (!authority) {
                return res.status(403).send('unauthorized to view authorities');
            }
            if (err) {
                return res.status(400).send('unable to determine access');
            }
            authoritiesController.fetchAuthorities(req.query.limit, req.query.offset, function (err, authorities) {
                if (err) {
                    return res.status(400).send('error fetching authorities');
                } else {
                    return res.status(200).json(authorities);
                }
            });
        });
    });

    router.get('/authorityRequests', bodyParser.json(), async function (req, res) {
        // gets all authority requests sorted by creationDate
        // paged

        authoritiesController.fetchAuthorityRequests(req.query.limit, req.query.offset, req.query.pending || false, req.user.id, function (err, authorityRequests) {
            if (err) {
                return res.status(400).send('error fetching authorities');
            } else {
                return res.status(200).json(authorityRequests);
            }
        });
    });

};