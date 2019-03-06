const mechanicMonthDebit = function (sequelize, DataTypes) {
    const MechanicMonthDebit = sequelize.define('mechanicMonthDebit', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        debitMonth: {
            type: DataTypes.INTEGER
        },
        debitYear: {
            type: DataTypes.INTEGER
        }
    }, {
        freezeTableName: true,
    });

    MechanicMonthDebit.associate = models => {
        MechanicMonthDebit.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };
    return MechanicMonthDebit;
};

module.exports = mechanicMonthDebit;