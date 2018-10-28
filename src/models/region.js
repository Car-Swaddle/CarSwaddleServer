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
        Region.belongsTo(models.Mechanic, { foreignKey: 'regionID' });
    };

    Region.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());

        var latitude = values.origin.coordinates[0];
        var longitude = values.origin.coordinates[1];

        delete values.origin;

        values.latitude = latitude;
        values.longitude = longitude;
        
        values.mechanicID = values.regionID;

        delete values.regionID;

        return values;
    }
    
    /*
    origin =     {
        coordinates =         (
            "11.909",
            "-11.7898"
        );
        type = Point;
    };
    */

    return Region;
};

module.exports = region;