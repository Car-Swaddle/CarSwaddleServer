const constants = require('../../controllers/constants');
const bodyParser = require('body-parser');

module.exports = (router, models) => {
    const authoritiesController = require('../../controllers/authorities')(models);
    const referrerController = new (require('../../controllers/referrer'))(models);
    const readAuthority = models.Authority.NAME.readReferrers;
    const editAuthority = models.Authority.NAME.editReferrers;
    
    router.get('/referrers', bodyParser.json(), async function (req, res) {
        // TODO - can we move this to middleware somehow?
        await authoritiesController.checkAuthority(req, res, readAuthority);
        return res.json([]);
    });

    router.get('/referrers/:referrerID', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, readAuthority);
        // req.params.referrerID
        return res.json({});
    });

    router.post('/referrers', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        return res.json({});
    });

    router.put('/referrers/:referrerID', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        return res.json({});
    });

    router.delete('/referrers/:referrerID', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        return res.end();
    });

    router.get('/pay-structures', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, readAuthority);
        
        referrerController.getPayStructures().then((payStructures) => {
            res.json(payStructures);
        }).catch((error) => {
            res.status(400).json({error: "Unable to list pay structures"});
            req.log.warn(error);
        });
    });

    router.get('/pay-structures/:payStructureID', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, readAuthority);

        referrerController.getPayStructure(req.params.payStructureID).then((payStructure) => {
            res.json(payStructure);
        }).catch((error) => {
            res.status(400).json({error: "Unable to get pay structure"});
            req.log.warn(error);
        });
    });

    router.post('/pay-structures', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        // TODO - validation
        referrerController.createPayStructure(req.body).then((created) => {
            res.json(created);
        }).catch((error) => {
            res.status(400).json({error: "Unable to create pay structure"});
            req.log.warn(error);
        })
    });

    router.put('/pay-structures/:payStructureID', bodyParser.json(), async function (req, res) {
        await authoritiesController.checkAuthority(req, res, editAuthority);
        // TODO - validation
        referrerController.updatePayStructure(req.body).then((created) => {
            res.json(created);
        }).catch((error) => {
            res.status(400).json({error: "Unable to update pay structure"});
            req.log.warn(error);
        })
    });

    router.delete('/pay-structures/:payStructureID', bodyParser.json(), async function (req, res) {
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

