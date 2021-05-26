const express = require('express');
const models = require('../../models')
const { Authority, Referrer } = models;
const ReferrerController = require('../../controllers/referrer');

module.exports = (router) => {
    const authoritiesController = require('../../controllers/authorities')(models);
    const referrerController = new ReferrerController();
    const readAuthority = Authority.NAME.readReferrers;
    const editAuthority = Authority.NAME.editReferrers;

    async function checkIsCurrentReferrerOrAdmin(referrerId, req, res) {
        if (await authoritiesController.hasAuthority(req, res, readAuthority)) {
            return;
        }
        
        const referrer = await Referrer.findByPk(referrerId);
        if (!referrer) {
            res.sendStatus(404);
            throw 'Referrer not found';
        }
        if (referrer.userId !== req.user.id) {
            res.sendStatus(403);
            throw 'No access to referrer';
        }
    }
    
    router.get('/referrers', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, readAuthority);

        referrerController.getReferrers(req.params.limit ?? 100, req.params.offset ?? 0).then((referrers) => {
            res.json(referrers);
        }).catch((error) => {
            res.status(400).json({error: "Unable to list referrers"});
            req.log.warn(error);
        });
    });

    router.get('/referrers/current-user', express.json(), async function (req, res) {
        referrerController.getReferrerForUserID(req.user.id).then((referrer) => {
            res.json(referrer);
        }).catch((error) => {
            res.status(400).json({error: "Unable to get referrer"});
            req.log.warn(error);
        });
    });

    router.get('/referrers/:referrerID', express.json(), async function (req, res) {
        await checkIsCurrentReferrerOrAdmin(req.params.referrerID, req, res);

        referrerController.getReferrer(req.params.referrerID).then((referrer) => {
            res.json(referrer);
        }).catch((error) => {
            res.status(400).json({error: "Unable to get referrer"});
            req.log.warn(error);
        });
    });

    router.get('/referrers/:referrerID/summary', express.json(), async function (req, res) {
        await checkIsCurrentReferrerOrAdmin(req.params.referrerID, req, res);
        
        referrerController.getReferrerSummary(req.params.referrerID).then((summary) => {
            res.json(summary);
        }).catch((error) => {
            res.status(400).json({error: "Unable to get referrer summary"});
            req.log.warn(error);
        });
    });

    router.get('/referrers/:referrerID/transactions', express.json(), async function (req, res) {
        await checkIsCurrentReferrerOrAdmin(req.params.referrerID, req, res);
        
        referrerController.getReferrerTransactions(req.params.referrerID, req.params.limit ?? 100, req.params.offset ?? 0).then((transactions) => {
            res.json(transactions);
        }).catch((error) => {
            res.status(400).json({error: "Unable to get referrer transactions"});
            req.log.warn(error);
        });
    });

    router.post('/referrers', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);

        referrerController.createReferrer(req.body).then((created) => {
            res.json(created);
        }).catch((error) => {
            res.status(400).json({error: "Unable to create referrer"});
            req.log.warn(error);
        })
    });

    router.post('/referrers/:referrerID/payout', express.json(), async function (req, res) {
        await checkIsCurrentReferrerOrAdmin(req.params.referrerID, req, res);

        referrerController.executeReferrerPayout(req.params.referrerID).then(() => {
            res.sendStatus(200);
        }).catch((error) => {
            res.status(400).json({error: "Unable to payout transactions"});
            req.log.warn(error);
        })
    });

    router.put('/referrers/:referrerID', express.json(), async function (req, res) {
        await checkIsCurrentReferrerOrAdmin(req.params.referrerID, req, res);

        req.body.id = req.params.referrerID;
        referrerController.updateReferrer(req.body).then((created) => {
            res.json(created);
        }).catch((error) => {
            res.status(400).json({error: "Unable to update referrer"});
            req.log.warn(error);
        })
    });

    router.delete('/referrers/:referrerID', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);

        referrerController.deleteReferrer(req.params.referrerID).then(() => {
            res.end();
        }).catch((error) => {
            res.status(400).json({error: "Unable to delete referrer"});
            req.log.warn(error);
        })
    });

    router.get('/pay-structures', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, readAuthority);
        
        referrerController.getPayStructures().then((payStructures) => {
            res.json(payStructures);
        }).catch((error) => {
            res.status(400).json({error: "Unable to list pay structures"});
            req.log.warn(error);
        });
    });

    router.get('/pay-structures/:payStructureID', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, readAuthority);

        referrerController.getPayStructure(req.params.payStructureID).then((payStructure) => {
            res.json(payStructure);
        }).catch((error) => {
            res.status(400).json({error: "Unable to get pay structure"});
            req.log.warn(error);
        });
    });

    router.post('/pay-structures', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        // TODO - validation
        referrerController.createPayStructure(req.body).then((created) => {
            res.json(created);
        }).catch((error) => {
            res.status(400).json({error: "Unable to create pay structure"});
            req.log.warn(error);
        })
    });

    router.put('/pay-structures/:payStructureID', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        // TODO - validation
        req.body.id = req.params.payStructureID;
        referrerController.updatePayStructure(req.body).then((created) => {
            res.json(created);
        }).catch((error) => {
            res.status(400).json({error: "Unable to update pay structure"});
            req.log.warn(error);
        })
    });

    router.delete('/pay-structures/:payStructureID', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        
        referrerController.deletePayStructure(req.params.payStructureID).then(() => {
            res.end();
        }).catch((error) => {
            res.status(400).json({error: "Unable to delete pay structure"});
            req.log.warn(error);
        })
    });

    return router;
};
