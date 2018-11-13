const express = require('express');
const uuidV1 = require('uuid/v1');

module.exports = function (router, models) {

    router.get('/availability', function (req, res) {

        var mechanicID = req.query.mechanicID;

        if (mechanicID == null) {
            req.user.getMechanic().then( function(mechanic) {
                models.TemplateTimeSpan.findAll({
                    where: {
                        mechanicID: mechanic.id
                    }
                }).then( timeSpans => {
                    return res.json(timeSpans);
                });
            });
        } else {
            models.TemplateTimeSpan.findAll({
                where: {
                    mechanicID: mechanicID
                }
            }).then( timeSpans => {
                return res.json(timeSpans);
            });
        }
    });

    router.post('/availability', function (req, res) {

        var spans = req.body.spans;
        
        if (spans == null) { 
            res.status(400).send('Must provide a body');
            return
        }

        req.user.getMechanic().then( function(mechanic) {
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
                        var promise = newSpan.setMechanic(mechanic);
                        promises.push(promise);
                    }
                    Promise.all(promises).then(function(updatedSpans) { 
                        models.TemplateTimeSpan.findAll().then( fs => {
                            return res.json(fs);
                        });
                    });
                });
            });
        });
    });

    return router;
};
