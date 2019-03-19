const express = require('express');
const uuidV1 = require('uuid/v1');
const bodyParser = require('body-parser');

module.exports = function (router, models) {

    router.get('/availability', bodyParser.json(), function (req, res) {

        var mechanicID = req.query.mechanicID;

        if (mechanicID == null) {
            req.user.getMechanic().then( function(mechanic) {
                if (mechanic == null) {
                    return res.status(422).send('unable to find mechanic');
                }
                findTimeSpansForMechanic(mechanic.id).then( timeSpans => {
                    return res.json(timeSpans);
                });
            });
        } else {
            findTimeSpansForMechanic(mechanicID).then( timeSpans => {
                return res.json(timeSpans);
            });
        }
    });

    router.post('/availability', bodyParser.json(), function (req, res) {
        var spans = req.body.spans;
        if (spans == null) { 
            res.status(400).send('Must provide a body');
            return
        }
        req.user.getMechanic().then( function(mechanic) {
            if (mechanic == null) { 
                res.status(400).send('Must have a current mechanic');
                return
            }
            models.TemplateTimeSpan.destroy({where: { mechanicID: mechanic.id }}).then(function () {
                for (i = 0; i < spans.length; i++) { 
                    var val = spans[i];
                    val.id = uuidV1();
                    val.startTime = models.TemplateTimeSpan.getStartTimeDate(val.startTime);
                }
                models.TemplateTimeSpan.bulkCreate(spans).then( newSpans => {
                    var promises = []
                    for (i = 0; i < newSpans.length; i++) { 
                        var newSpan = newSpans[i];
                        newSpan.mechanicID = mechanic.id;
                        newSpan.setMechanic(mechanic, { save: false });
                        var promise = newSpan.save();
                        promises.push(promise);
                    }

                    mechanic.hasSetAvailability = true
                    const mechanicPromise = mechanic.save();
                    promise.push(mechanicPromise);

                    Promise.all(promises).then(function(updatedSpans) { 
                        findTimeSpansForMechanic(mechanic.id).then( fs => {
                            return res.json(fs);
                        });
                    });
                });
            });
        });
    });

    function findTimeSpansForMechanic(mechanicID) {
        return models.TemplateTimeSpan.findAll({
            where: {
                mechanicID: mechanicID
            }
        });
    }

    return router;
};
