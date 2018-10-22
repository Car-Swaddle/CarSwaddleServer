const express = require('express');

module.exports = function (router, models) {

    router.post('/availability', function (req, res) {
        console.log('templateTimeSpan POST');

        var spans = req.body.spans;
        
        if (spans == null) { 
            res.status(400).send('Must provide a body');
            return
        }
        console.log(spans);

        req.user.getMechanic().then( function(mechanic) {
            models.TemplateTimeSpan.destroy({where: { templateTimeSpanID: mechanic.id }}).then(function () {
                // var promises = []
                for (i = 0; i < spans.length; i++) { 
                    var val = spans[i];
                    val.startTime = models.TemplateTimeSpan.getStartTimeDate(val.startTime);
                }
                models.TemplateTimeSpan.bulkCreate(spans).then( newSpans => {
                    var promises = []
                    for (i = 0; i < newSpans.length; i++) { 
                        var newSpan = newSpans[i];
                        var promise = newSpan.setMechanic(mechanic);
                        promises.push(promise);
                    }
                    Promise.all(promises).then(function(updatedSpans) { 
                        return res.json(updatedSpans);
                    })
                });
            });
        });
    });

    return router;
};
