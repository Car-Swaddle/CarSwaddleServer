const payStructure = function (sequelize, DataTypes) {
    const PayStructure = sequelize.define('payStructure', {
        percentageOfPurchase: {
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
            defaultValue: '1'
        },
        getPaidEvenIfCouponIsApplied: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: '1'
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