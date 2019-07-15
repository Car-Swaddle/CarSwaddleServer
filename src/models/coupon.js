const coupon = function (sequelize, DataTypes) {
    const Coupon = sequelize.define('coupon', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
            notEmpty: true,
        },
        amountOff: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        percentOff: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        redemptions: {
            type: DataTypes.INTEGER,
        },
        maxRedemptions: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        redeemBy: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        discountBookingFee: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        isCorporate: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        }
    }, {
        freezeTableName: true,
    });

    Coupon.associate = models => {
        Coupon.belongsTo(models.User, { foreignKey: 'createdByUserID' });
        Coupon.belongsTo(models.Mechanic, { foreignKey: 'createdByMechanicID' });
    };

    const { Op } = sequelize;

    function redeemableQuery(couponId, mechanicId) {
        return {
            where: {
                id: couponId,
                [Op.and]: [{
                    [Op.or]: [{
                        isCorporate: true
                    }, {
                        createdByMechanicID: mechanicId,
                    }]
                }, {
                    [Op.or]: [{
                        maxRedemptions: null
                    }, {
                        redemptions: {
                            [Op.lt]: {
                                [Op.col]: 'maxRedemptions'
                            }
                        }
                    }]
                }, {
                    [Op.or]: [{
                        redeemBy: null
                    }, {
                        redeemBy: {
                            [Op.gt]: new Date(),
                        }
                    }]
                }]
            }
        };
    }

    Coupon.findRedeemable = (couponId, mechanicId) => {
        return Coupon.findOne(
            redeemableQuery(couponId, mechanicId)
        );
    }

    Coupon.undoRedeem = (coupon) => {
        if(!coupon) {
            return Promise.resolve();
        }

        return Coupon.update({
            redemptions: sequelize.literal('redemptions - 1')
        }, {
            where: {
                id: coupon.id
            }
        });
    };

    Coupon.redeem = (couponId, mechanicId) => {
        if(!couponId) {
            return Promise.resolve(null);
        }

        const update = Coupon.update({
            redemptions: sequelize.literal('redemptions + 1')
        }, redeemableQuery(couponId, mechanicId));

        return update.then(res => {
            return res[0] === 1
                ? Coupon.findById(couponId)
                : null;
        });
    };

    return Coupon;
};

module.exports = coupon;
