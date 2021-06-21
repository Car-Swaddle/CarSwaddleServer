
var methods = function(models) {
    
    function numberOfAutoServicesProvided(id) {
        return models.sequelize.query(`SELECT COALESCE(COUNT(object), 0) as count FROM (SELECT FROM "autoService" as a WHERE "mechanicID" = ? AND "status" = 'completed') as object`, {
            replacements: [id],
            type: models.sequelize.QueryTypes.SELECT
        });
    };

    function averageReceivedRating(id) {
        return models.sequelize.query('SELECT AVG(object.rating) as rating FROM (SELECT r.rating as rating FROM review as r WHERE "revieweeID" = ?) as object', {
            replacements: [id],
            type: models.sequelize.QueryTypes.SELECT
        });
    };

    function numberOfRatingsReceived(id) {
        return models.sequelize.query('SELECT COALESCE(COUNT(object), 0) as count FROM (SELECT FROM review as r WHERE "revieweeID" = ?) as object', {
            replacements: [id],
            type: models.sequelize.QueryTypes.SELECT
        });
    };

    return {
        numberOfAutoServicesProvided: numberOfAutoServicesProvided,
        averageReceivedRating: averageReceivedRating,
        numberOfRatingsReceived: numberOfRatingsReceived
    }

};

module.exports = methods;