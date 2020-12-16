const express = require('express');
const uuidV1 = require('uuid/v1');
const constants = require('../../controllers/constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const fileStore = require('../../data/file-store.js');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const stripeFiles = require('../../controllers/stripe-files.js')();
const asyncMiddleware = require('../../lib/middleware/async-middleware');
const Util = require("../../util/util").Util;

module.exports = function (router, models) {

    const stats = require('../stats.js')(models);

    const authoritiesControllerFile = require('../../controllers/authorities.js');
    const authoritiesController = authoritiesControllerFile(models);

    router.get('/current-mechanic', bodyParser.json(), async function (req, res) {
        const mechanic = await req.user.getMechanic();
        return res.json(mechanic);
    });

    router.get('/stats', bodyParser.json(), async function (req, res) {
        if (req.query.mechanic == null) {
            return res.status(422).send('invalid parameters');
        }
        const mechanicID = req.query.mechanic;
        const averageRating = await stats.averageReceivedRating(mechanicID);
        const numberOfRatings = await stats.numberOfRatingsReceived(mechanicID);
        const autoServicesProvided = await stats.numberOfAutoServicesProvided(mechanicID);

        const avg = averageRating[0].rating;
        const count = parseInt(numberOfRatings[0].count);
        const services = parseInt(autoServicesProvided[0].count);

        if (avg == null || count == null || services == null) {
            return res.status(404).send();
        }

        var json = {}
        json[mechanicID] = {
            averageRating: avg,
            numberOfRatings: count,
            autoServicesProvided: services
        }

        return res.json(json);
    });

    router.get('/nearest-mechanics', bodyParser.json(), function (req, res) {
        console.log('nearest-mechanics GET');
        var query = req.query;
        var latitude = parseFloat(query.latitude);
        var longitude = parseFloat(query.longitude);
        var limit = query.limit || 10;
        limit = limit > 25 ? 25 : limit;
        const maxDistance = parseFloat(query.maxDistance) || 100000;

        models.sequelize.query(`
            SELECT *, u.id as "userID", m.id as "id", r.id as "regionID", ST_Distance(ST_SetSRID(r.origin, 4326), ST_SetSRID(ST_MakePoint(?, ?), 4326), false) AS "distance"
            FROM "user" AS u
            INNER JOIN mechanic as m ON m."userID" = u.id
            INNER JOIN region AS r ON m.id = r."mechanicID"
            AND ST_Distance(ST_SetSRID(r.origin, 4326), ST_SetSRID(ST_MakePoint(?, ?), 4326), false) < r.radius
            AND m."isActive" = true AND m."isAllowed" = true
            AND ST_Distance(ST_SetSRID(r.origin, 4326), ST_SetSRID(ST_MakePoint(?, ?), 4326), false) <= ?
            ORDER BY ST_Distance(ST_SetSRID(r.origin, 4326), ST_SetSRID(ST_MakePoint(?, ?), 4326), false)
            FETCH FIRST ? ROWS ONLY
            `, {
            replacements: [longitude, latitude, longitude, latitude, longitude, latitude, maxDistance, longitude, latitude, limit],
            type: models.sequelize.QueryTypes.SELECT,
            model: models.User
        }).then(users => {
            return res.json(users);
        });
    });

    router.post('/update-mechanic/corperate', bodyParser.json(), async function (req, res) {
        const mechanicID = req.query.mechanicID;
        if (!mechanicID) {
            return res.status(400).send('Invalid parameters');
        }
        const authority = await authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.editMechanics);
        if (!authority) {
            return res.status(401).send('You need the required authority');
        }
        const mechanic = await models.Mechanic.findByPk(mechanicID);
        if (!mechanic) {
            return res.status(400).send('Invalid parameter');
        }
        if (req.body.isAllowed) {
            mechanic.isAllowed = req.body.isAllowed;
        }
        await mechanic.save();
        return res.status(200).send(mechanic);
    });

    router.patch('/update-mechanic', bodyParser.json(), function (req, res) {
        const body = req.body;
        var user = req.user;
        var didChangeMechanic = false;

        user.getMechanic().then(mechanic => {
            if (mechanic == null) {
                return res.status(400).send();
            }
            var promises = [];
            if (body.isActive != null) {
                mechanic.isActive = body.isActive
                didChangeMechanic = true
            }
            if (body.token != null) {
                didChangeMechanic = true
                var promise = models.DeviceToken.findOne({
                    where: {
                        token: body.token,
                        mechanicID: mechanic.id
                    }
                }).then(deviceToken => {
                    if (deviceToken == null) {
                        return models.DeviceToken.create({
                            id: uuidV1(),
                            token: body.token
                        }).then(deviceToken => {
                            mechanic.addDeviceToken(deviceToken);
                            return mechanic.save();
                        });
                    } else {
                        return null;
                    }
                });
                promises.push(promise);
            }
            if (body.address != null) {
                didChangeMechanic = true;
                var address = body.address;
                if (address.line1 == null || address.city == null || address.postalCode == null || address.state == null) {
                    return res.status(422).send();
                }
                if (address.country == null) {
                    address.country = 'US';
                }
                const promise = stripe.accounts.update(mechanic.stripeAccountID, {
                    individual: {
                        address: {
                            line1: address.line1,
                            line2: address.line2,
                            postal_code: address.postalCode,
                            city: address.city,
                            state: address.state,
                            country: address.country
                        },
                    }
                }).then(stripeAccount => {
                    if (stripeAccount == null) {
                        return;
                    }
                    return mechanic.getAddress().then(async oldAddress => {
                        if (oldAddress != null) {
                            await oldAddress.destroy();
                        }
                        return models.Address.create({
                            id: uuidV1(), line1: address.line1, city: address.city, postalCode: address.postalCode, state: address.state, country: address.country,
                        }).then(newAddress => {
                            return mechanic.setAddress(newAddress);
                        });
                    });
                });
                promises.push(promise);
            }

            if (body.ssnLast4 != null) {
                didChangeMechanic = true;
                const promise = stripe.accounts.update(mechanic.stripeAccountID, {
                    individual: {
                        ssn_last_4: body.ssnLast4,
                    }
                });
                promises.push(promise);
            }

            if (body.personalID != null) {
                didChangeMechanic = true;
                const promise = stripe.accounts.update(mechanic.stripeAccountID, {
                    individual: {
                        id_number: body.personalID,
                    }
                });
                promises.push(promise);
            }

            if (body.externalAccount != null) {
                didChangeMechanic = true;
                const promise = stripe.accounts.update(mechanic.stripeAccountID, {
                    external_account: body.externalAccount
                });
                promises.push(promise);
            }

            if (body.dateOfBirth != null) {
                didChangeMechanic = true;
                const date = new Date(body.dateOfBirth);
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();

                const promise = stripe.accounts.update(mechanic.stripeAccountID, {
                    individual: {
                        dob: {
                            day: day,
                            month: month,
                            year: year
                        }
                    }
                }).then(stripeAccount => {
                    if (stripeAccount == null) {
                        return;
                    }
                    mechanic.dateOfBirth = body.dateOfBirth;
                    return;
                }).catch(error => {
                    console.log('error: ' + error);
                });
                promises.push(promise);
            }

            if (body.chargeForTravel != null) {
                mechanic.chargeForTravel = body.chargeForTravel
                didChangeMechanic = true
            }

            if (didChangeMechanic == true) {
                Promise.all(promises).then(values => {
                    mechanic.save().then(savedMechanic => {
                        models.Mechanic.findOne({
                            where: { id: savedMechanic.id },
                            attributes: ['id', 'isActive', 'dateOfBirth', 'userID', 'chargeForTravel'],
                            include: ['address'],
                        }).then(updatedMechanic => {
                            return res.send(updatedMechanic);
                        });
                    });
                });
            } else {
                return res.send(mechanic);
            }
        });
    });

    router.post('/data/mechanic/profile-picture', fileUpload(), async function (req, res) {
        if (req.files == null) {
            return res.status(400).send('No files were uploaded.');
        }
        if (Object.keys(req.files).length == 0) {
            return res.status(400).send('No files were uploaded.');
        }
        var mechanic = await req.user.getMechanic();

        if (mechanic == null) {
            return res.status(400).send('No mechanic');
        }

        let file = req.files.image;
        fileStore.uploadImage(file.data, mechanic.profileImageID).then(name => {
            console.log(name);
            if (name != null) {
                mechanic.profileImageID = name;
                mechanic.save().then(mechanic => {
                    return res.status(200).json({ 'profileImageID': name });
                }).catch(error => {
                    return res.status(400).send('Unable to upload image to user');
                });
            } else {
                return res.status(400).send('Unable to upload image');
            }
        });
    });

    router.get('/data/mechanic/profile-picture/:mechanicID', bodyParser.json(), function (req, res) {
        const mechanicID = req.params.mechanicID;
        if (mechanicID == null) {
            return res.status(422).send('invalid parameters');
        }
        models.Mechanic.findByPk(mechanicID).then(mechanic => {
            fileStore.getImage(mechanic.profileImageID).then(data => {
                if (data == null) {
                    res.status(404).send();
                }
                res.writeHead(200, { 'Content-Type': 'image/*' });
                res.write(data.Body, 'binary');
                res.end(null, 'binary');
            }).catch(error => {
                return res.status(400).send('unable to fetch profile image');
            });
        }).catch(error => {
            return res.status(400).send('unable to fetch profile image');
        });
    });


    router.post('/data/mechanic/identity-document', fileUpload(), async function (req, res) {
        if (req.files == null) {
            return res.status(400).send('No files were uploaded.');
        }
        if (Object.keys(req.files).length == 0) {
            return res.status(400).send('No files were uploaded.');
        }
        var mechanic = await req.user.getMechanic();

        if (mechanic == null) {
            return res.status(400).send('No mechanic');
        }

        let image = req.files.image;
        let name = req.files.image.name;

        let side = req.query.side || 'front';

        if (side != 'front' && side != 'back') {
            return res.status(422).send('Invalid parameters');
        }

        stripeFiles.uploadIdentityDocument(image, name, mechanic, side, function (err, mechanic) {
            if (err) {
                return res.status(400).send();
            } else {
                return res.status(200).json(mechanic);
            }
        });
    });

    router.get('/mechanics', async function (req, res) {

        var orderKey = 'createdAt';
        var sortType = 'DESC';

        if (req.query.sortType == 'ascending') {
            sortType = 'ASC';
        }

        try {
            const authority = await authoritiesController.fetchAuthorityForUser(req.user.id, models.Authority.NAME.readMechanics);

            if (!authority) {
                return res.status(400).send();
            }

            const mechanics = await models.Mechanic.findAll({
                offset: Math.min(req.query.offset || 30, 100),
                limit: Math.min(req.query.limit || 30, 100),
                order: [[orderKey, sortType]],
                include: {
                    model: models.User, attributes: models.User.defaultAttributes
                }
            });

            res.send(mechanics);
        } catch (e) {
            res.status(400).send('unable to fetch mechanics');
        }
    });

    router.get('/mechanic/pricing', bodyParser.json(), asyncMiddleware(async function (req, res) {
        try {
            const currentMechanic = await req.user.getMechanic();
            const oilChangePricing = await models.OilChangePricing.findOne({
                where: {
                    mechanicID: currentMechanic.id
                }
            });
            return res.json(oilChangePricing);
        } catch (e) {
            res.status(400).send('unable to fetch oil change pricing');
        }
    }));

    router.put('/mechanic/pricing', bodyParser.json(), asyncMiddleware(async function (req, res) {
        try {
            var {
                conventional,
                conventionalPerQuart,
                blend,
                blendPerQuart,
                synthetic,
                syntheticPerQuart,
                highMileage,
                highMileagePerQuart
            } = req.body;

            if (!Util.areNumbers(conventional, blend, synthetic, highMileage)) {
                return res.status(400).send('unable to update, missing or invalid values');
            }

            if (!Util.areNullOrNumbers(conventionalPerQuart, blendPerQuart, syntheticPerQuart, highMileagePerQuart)) {
                return res.status(400).send('unable to update, invalid values for per quart');
            }

            if (!conventionalPerQuart) {
                conventionalPerQuart = conventional / 5;
            }
            if (!blendPerQuart) {
                blendPerQuart = blend / 5;
            }
            if (!syntheticPerQuart) {
                syntheticPerQuart = synthetic / 5;
            }
            if (!highMileagePerQuart) {
                highMileagePerQuart = highMileage / 5;
            }

            const isValidPrice = (price) => price < 12000 && price > 300;
            const isValidPerQuartPrice = (price) => isValidPrice(price * 5);

            if ([conventional, blend, synthetic, highMileage].every(isValidPrice) &&
                    [conventionalPerQuart, blendPerQuart, syntheticPerQuart, highMileagePerQuart].every(isValidPerQuartPrice)) {
                return res.status(422).send('not all prices are valid');
            }

            const currentMechanic = await await req.user.getMechanic();
            const oilChangePricing = await models.OilChangePricing.findOne({
                where: {
                    mechanicID: currentMechanic.id
                }
            });

            oilChangePricing.conventional = conventional;
            oilChangePricing.conventionalPerQuart = conventionalPerQuart;
            oilChangePricing.blend = blend;
            oilChangePricing.blendPerQuart = blendPerQuart;
            oilChangePricing.synthetic = synthetic;
            oilChangePricing.syntheticPerQuart = syntheticPerQuart;
            oilChangePricing.highMileage = highMileage;
            oilChangePricing.highMileagePerQuart = highMileagePerQuart;

            await oilChangePricing.save();

            return res.send(oilChangePricing);
        } catch (e) {
            res.status(400).send('unable to update oil change pricing');
        }
    }));

    return router;
};
