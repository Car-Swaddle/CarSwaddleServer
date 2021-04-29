const express = require('express');

module.exports = (router, models) => {
    const authoritiesController = require('../../controllers/authorities')(models);
    const referrerController = new (require('../../controllers/referrer'))(models);
    const readAuthority = models.Authority.NAME.readReferrers;
    const editAuthority = models.Authority.NAME.editReferrers;

    async function checkIsCurrentReferrerOrAdmin(req, res) {
        // TODO - fetch and check matching user

        await authoritiesController.checkAuthority(req, res, readAuthority);
    }
    
    router.get('/referrers', express.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, readAuthority);
                
        const offset = req.query.offset || 0;
        const limit = req.query.limit || 50;
        referrerController.getReferrers(limit, offset).then((referrers) => {
            res.json(referrers);
        }).catch((error) => {
            res.status(400).json({error: "Unable to list referrers"});
            req.log.warn(error);
        });
    });

    router.get('/referrers/:referrerID', express.json(), async function (req, res) {
        checkIsCurrentReferrerOrAdmin(req, res);
        
        referrerController.getReferrer(req.params.referrerID).then((referrer) => {
            res.json(referrer);
        }).catch((error) => {
            res.status(400).json({error: "Unable to get referrer"});
            req.log.warn(error);
        });
    });

    router.get('/referrers/:referrerID/summary', express.json(), async function (req, res) {
        checkIsCurrentReferrerOrAdmin(req, res);
        
        // TODO
    });

    router.get('/referrers/:referrerID/transactions', express.json(), async function (req, res) {
        checkIsCurrentReferrerOrAdmin(req, res);
        
        // TODO
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
        checkIsCurrentReferrerOrAdmin(req, res);

        // TODO
    });

    router.put('/referrers/:referrerID', express.json(), async function (req, res) {
        checkIsCurrentReferrerOrAdmin(req, res);

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
