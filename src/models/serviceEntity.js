const serviceEntity = function (sequelize, DataTypes) {
    const ServiceEntity = sequelize.define('serviceEntity', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        type: {
            type: DataTypes.STRING,
        },
        entityID: {
            type: DataTypes.DOUBLE,
        }
    }, {
        freezeTableNames: true,
    });

    ServiceEntity.associate = models => {
        ServiceEntity.belongsTo(models.AutoService, { foreignKey: 'serviceEntityID' });
    };

    return ServiceEntity;
};

module.exports = serviceEntity;
