const vehicleDescription = function (sequelize, DataTypes) {
    const VehicleDescription = sequelize.define('vehicleDescription', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        make: {
            type: DataTypes.STRING
        },
        model: {
            type: DataTypes.STRING
        },
        style: {
            type: DataTypes.STRING
        },
        trime: {
            type: DataTypes.STRING
        },
        year: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        freezeTableName: true,
    });

    VehicleDescription.associate = models => {
        VehicleDescription.belongsTo(models.Vehicle, { foreignKey: 'vehicleID' });
    };

    return VehicleDescription;
};


module.exports = vehicleDescription;