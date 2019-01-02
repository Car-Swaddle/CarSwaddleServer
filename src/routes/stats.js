// var dto = {
// 	timestamp: function() {
// 		console.log('Current Time in Unix Timestamp: ' + Math.floor(Date.now() / 1000));
// 	},
// 	currentDate: function() {
// 		console.log('Current Date is: ' + new Date().toISOString().slice(0, 10));
//     },
//     numberOfAutoServicesProvided: function(id)  {
//         return models.sequelize.query('SELECT COUNT(object) as count FROM (SELECT FROM "autoService" as r WHERE "mechanicID" = ? AND "status" = "completed") as object', {
//             replacements: [id],
//             type: models.sequelize.QueryTypes.SELECT
//         });
//     }
// };

var methods = function(models) {
    
    this.numberOfAutoServicesProvided = function (id) {
        return models.sequelize.query(`SELECT COUNT(object) as count FROM (SELECT FROM "autoService" as a WHERE "mechanicID" = ? AND "status" = 'completed') as object`, {
            replacements: [id],
            type: models.sequelize.QueryTypes.SELECT
        });
    };

    this.averageReceivedRating = function (id) {
        return models.sequelize.query('SELECT AVG(object.rating) as rating FROM (SELECT r.rating as rating FROM review as r WHERE "revieweeID" = ?) as object', {
            replacements: [id],
            type: models.sequelize.QueryTypes.SELECT
        });
    }

    this.numberOfRatingsReceived = function (id) {
        return models.sequelize.query('SELECT COUNT(object) as count FROM (SELECT FROM review as r WHERE "revieweeID" = ?) as object', {
            replacements: [id],
            type: models.sequelize.QueryTypes.SELECT
        });
    }

};

module.exports = methods;