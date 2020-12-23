const referrer = function (sequelize, DataTypes) {
    const Referrer = sequelize.define('referrer', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        // Pseudo-enum for source: affiliate, email, ad, campaign, etc
        sourceType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        externalId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        stripeExpressAccountID: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        freezeTableName: true,
    });

    Referrer.associate = models => {
        Referrer.belongsTo(models.User, { foreignKey: "userID", allowNull: true });
        Referrer.belongsTo(models.Coupon, { foreignKey: "couponID", allowNull: true, constraints: false });
        Referrer.hasOne(models.PayStructure, { foreignKey: "payStructureID", allowNull: true, constraints: false });
    };

    return Referrer;
};

module.exports = referrer;