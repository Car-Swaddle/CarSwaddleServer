const payStructure = function (sequelize, DataTypes) {
    const PayStructure = sequelize.define('payStructure', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        percentageOfProfit: {
            type: DataTypes.DECIMAL(5,4), // 0.0000
            allowNull: false
        },
        maxNumberOfPurchases: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        maxNumberOfPurchasesPerUser: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        getPaidEvenIfCouponIsApplied: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    }, {
            freezeTableName: true,
        });

    PayStructure.associate = models => {
        PayStructure.belongsTo(models.Referrer, { foreignKey: 'referrerID', allowNull: false });
    };

    return PayStructure;
};

module.exports = payStructure;