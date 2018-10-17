const vehicleDescription = function (sequelize, DataTypes) {
    const VehicleDescription = sequelize.define('vehicleDescription', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        licensePlate: {
            type: DataTypes.STRING,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vin: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
        {
            freezeTableName: true,
        });

    VehicleDescription.associate = models => {
        VehicleDescription.belongsTo(models.Vehicle, { foreignKey: 'vehicleDescriptionID' });
    };

    return VehicleDescription;
};


module.exports = vehicleDescription;