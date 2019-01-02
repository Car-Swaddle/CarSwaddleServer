const express = require('express');
const uuidV1 = require('uuid/v1');
const constants = require('../constants');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);

module.exports = function (router, models) {

    router.get('/current-mechanic', async function (req, res) {
        const mechanic = await req.user.getMechanic();
        return res.json(mechanic);
    });

    router.get('/nearest-mechanics', function (req, res) {
        console.log('nearest-mechanics GET');
        var query = req.query;
        var latitude = parseFloat(query.latitude);
        var longitude = parseFloat(query.longitude);
        var limit = query.limit || 10;
        limit = limit > 25 ? 25 : limit;
        const maxDistance = parseFloat(query.maxDistance) || 10000;

        models.sequelize.query('SELECT *, u.id as "userID", m.id as "id", r.id as "regionID", ST_Distance(r.origin, ST_MakePoint(?, ?), false) AS "distance" FROM "user" AS u INNER JOIN mechanic as m ON m."userID" = u.id INNER JOIN region AS r ON m.id = r."mechanicID" AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) < r.radius AND m."isActive" = true AND ST_Distance(r.origin, ST_MakePoint(?, ?), false) <= ? ORDER BY ST_MakePoint(?,?) <-> r.origin FETCH FIRST ? ROWS ONLY', {
            replacements: [longitude, latitude, longitude, latitude, longitude, latitude, maxDistance, longitude, latitude, limit],
            type: models.sequelize.QueryTypes.SELECT,
            model: models.User
        }).then(users => {
            return res.json(users);
        });
    });

    router.patch('/update-mechanic', function (req, res) {
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
                    legal_entity: {
                        address: {
                            line1: address.line1,
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
                    legal_entity: {
                        ssn_last_4: body.ssnLast4,
                    }
                });
                promises.push(promise);
            }

            if (body.personalID != null) {
                didChangeMechanic = true;
                const promise = stripe.accounts.update(mechanic.stripeAccountID, {
                    legal_entity: {
                        personal_id_number: body.personalID,
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
                const month = date.getMonth();
                const year = date.getFullYear();

                const promise = stripe.accounts.update(mechanic.stripeAccountID, {
                    legal_entity: {
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
                });
                promises.push(promise);
            }

            if (didChangeMechanic == true) {
                Promise.all(promises).then(values => {
                    mechanic.save().then(savedMechanic => {
                        models.Mechanic.findOne({
                            where: { id: savedMechanic.id },
                            attributes: ['id', 'isActive', 'dateOfBirth', 'userID'],
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

    return router;
};
