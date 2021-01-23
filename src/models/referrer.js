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
        // Internal metadata - id for ad campaign, email template
        externalID: {
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
        },
        vanityID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        activeCouponID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        activePayStructureID: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, {
        freezeTableName: true,
    });

    Referrer.associate = models => {
        Referrer.belongsTo(models.User, { foreignKey: "userID", allowNull: true });
        Referrer.hasMany(models.Coupon, { foreignKey: "referrerID", allowNull: true, constraints: false });
        Referrer.hasMany(models.PayStructure, { foreignKey: "referrerID", allowNull: true, constraints: false });
    };

    Referrer.getActiveCoupon = () => {
        if (!this.getCoupons()) {
            throw 'Coupons not fetched'
        }
        return this.getCoupons().find(c => c.getId() == this.getActiveCouponID());
    }

    Referrer.getActivePayStructure = () => {
        if (!this.getPayStructures()) {
            throw 'Pay structures not fetched'
        }
        return this.getPayStructures().find(ps => ps.getId() == this.getActivePayStructureID());
    }

    return Referrer;
};

module.exports = referrer;