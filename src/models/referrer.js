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
        // active pay structure id
        Referrer.belongsTo(models.User, {foreignKey: "userId", allowNull: true});
        Referrer.belongsTo(models.Coupon, {foreignKey: "couponId", allowNull: true});
    };

    return Referrer;
};

module.exports = referrer;