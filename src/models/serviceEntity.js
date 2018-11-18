const serviceEntity = function (sequelize, DataTypes) {
    const ServiceEntity = sequelize.define('serviceEntity', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        // OILCHANGE
        entityType: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        freezeTableName: true,
    });

    ServiceEntity.associate = models => {
        ServiceEntity.belongsTo(models.AutoService, { foreignKey: 'autoServiceID' });
        ServiceEntity.belongsTo(models.OilChange, { foreignKey: 'oilChangeID', allowNull: true });
    };

    ServiceEntity.ENTITY_TYPE = {
        oilChange: 'OILCHANGE',
    };
    
    ServiceEntity.isValidType = function (entityType) {
        if (ServiceEntity.ENTITY_TYPE.oilChange == entityType) {
          return true;
        } else {
          return false;
        }
    };

    return ServiceEntity;
};

module.exports = serviceEntity;
