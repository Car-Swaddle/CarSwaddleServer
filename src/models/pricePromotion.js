const pricePromotion = function (sequelize, DataTypes) {
    const PricePromotion = sequelize.define('pricePromotion', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        // The id of the promotion used to generate this price promotion
        // not an association because it will be one of mulitple types.
        promotionIdentifier: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // How to evaluate promotion. Percentage or dollar amount or car swaddle fee.
        // See `value` for Percentage or dollar amount.
        promotionType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        value: {
            type: DataTypes.INTEGER, // cents or percentage. If percentage, 1 is 1%, 50 is 50%. Min is 0 Max is 100
            allowNull: true
        },
    }, {
        freezeTableName: true,
    });

    PricePromotion.associate = models => {
        PricePromotion.belongsTo(models.Price, { foreignKey: 'priceID' });
        // Coupon.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };

    PricePromotion.PROMOTION_TYPE = {
        percentage: 'percentage',
        dollarAmount: 'dollarAmount',
        carSwaddleFee: 'carSwaddleFee'
    };

    return PricePromotion;
};

module.exports = pricePromotion;