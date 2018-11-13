const region = function (sequelize, DataTypes) {
    const Region = sequelize.define('region', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        origin: {
            type: DataTypes.GEOMETRY('POINT'),
        },
        radius: {
            type: DataTypes.DOUBLE,
        }
    }, {
        freezeTableNames: true,
    });

    Region.associate = models => {
        Region.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };

    Region.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());
        
        values.latitude = values.origin.coordinates[1];
        values.longitude = values.origin.coordinates[0];
        
        // values.mechanicID = values.regionID;

        delete values.origin;
        // delete values.regionID;

        return values;
    }

    return Region;
};

module.exports = region;