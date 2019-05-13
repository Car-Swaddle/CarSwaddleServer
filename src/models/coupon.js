const coupon = function (sequelize, DataTypes) {
    const Coupon = sequelize.define('coupon', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        code: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        value: {
            type: DataTypes.FLOAT
        },
        expireDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
    }, {
        freezeTableName: true,
    });

    Coupon.associate = models => {
        Coupon.belongsTo(models.Price, { foreignKey: 'priceID' });
        Coupon.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };

    Coupon.COUPONT_TYPE = {
        user: 'user',
        admin: 'admin',
    };

    return Coupon;
};

module.exports = coupon;