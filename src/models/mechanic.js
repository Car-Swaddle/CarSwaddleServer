const mechanic = function (sequelize, DataTypes) {
    const Mechanic = sequelize.define('mechanic', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        }
    },
    {
        freezeTableName: true,
    });

    Mechanic.associate = models => {
        Mechanic.hasMany(models.AutoService, { foreignKey: 'autoServiceID' });
        Mechanic.hasMany(models.TemplateTimeSpan, { foreignKey: 'templateTimeSpanID' });
        Mechanic.belongsTo(models.User, { foreignKey: 'mechanicID' });
    };

    return Mechanic;
};

module.exports = mechanic;