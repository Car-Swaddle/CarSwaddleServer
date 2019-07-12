const location = function (sequelize, DataTypes) {
    const uuidV1 = require('uuid/v1');

    const Location = sequelize.define('location', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        point: {
            type: DataTypes.GEOMETRY('POINT'),
        },
        streetAddress: {
            type: DataTypes.STRING
        }
    }, {
        freezeTableName: true,
    });

    Location.associate = models => {
        Location.belongsTo(models.AutoService, { foreignKey: 'autoServiceID' }); // Should have one or the other
        Location.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' }); // Should have one or the other
    };

    Location.findBySearch = function(locationID, address) {
        if (locationID) {
            return Location.findById(locationID);
        } else if (address != null && address.latitude != null && address.longitude != null) {
            return Location.create({
                point: {
                    type: 'Point',
                    coordinates: [
                        address.longitude,
                        address.latitude
                    ]
                },
                streetAddress: address.streetAddress,
                id: uuidV1(),
            });
        }
    };

    return Location;
};

module.exports = location;