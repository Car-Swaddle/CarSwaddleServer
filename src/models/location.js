const location = function (sequelize, DataTypes) {
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
    return Location;
};

module.exports = location;