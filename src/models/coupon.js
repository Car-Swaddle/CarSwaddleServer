const Hashids = require('hashids/cjs')
const hashids = new Hashids('Car Swaddle', 6)


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

    Coupon.findRedeemable = async (couponId, mechanicId) => {
        const redeemableCoupon = await Coupon.findOne(
            redeemableQuery(couponId, mechanicId)
        );
        var error = null;

        if (!redeemableCoupon) {
            const coupon = await Coupon.findById(couponId);

            if (!coupon) {
                error = 'INCORRECT_CODE';
            } else if (coupon.redeemBy && coupon.redeemBy.getTime() < Date.now()) {
                error = 'EXPIRED';
            } else if (!coupon.isCorporate && coupon.createdByMechanicID !== mechanicId) {
                error = 'INCORRECT_MECHANIC';
            } else if (coupon.redemptions >= coupon.maxRedemptions) {
                error = 'DEPLETED_REDEMPTIONS';
            } else {
                error = 'OTHER';
            }
        }

        return { coupon: redeemableCoupon, error };
    }

    Coupon.undoRedeem = (coupon) => {
        if (!coupon) {
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
        if (!couponId) {
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

    Coupon.fetchOrCreateShareableCoupons = async (userId, count) => {
        if (!userId) {
            return;
        }

        const limit = count || 3;

        const coupons = await Coupon.findAll({
            where: {
                createdByUserID: userId
            },
            limit: limit,
        });

        const leftToCreateCount = limit - (coupons.length || 0);
        if (leftToCreateCount == 0) {
            return coupons;
        }

        var formattedUserIds = [];
        for (var i = 0; i < 30; i++) {
            const randomNumber = Math.round(Math.random() * (9999999999999 - 0) + 0);
            const hashId = hashids.encode(randomNumber);
            formattedUserIds.push(hashId);
            console.log(hashId);
        }

        var formattedUserIdsDict = {};
        for (var i = 0; i < formattedUserIds.length; i++) {
            formattedUserIdsDict[formattedUserIds[i]] = true;
        }

        const matchingCoupons = await Coupon.fetchAllWithIds(formattedUserIds);

        for (var i = 0; i < matchingCoupons.length; i++) {
            const matchingCoupon = matchingCoupons[i];
            delete formattedUserIdsDict[matchingCoupon.id];
        }

        var newCouponCount = 0;
        var newCoupons = [];
        for (var key in formattedUserIdsDict) {
            console.log(key);
            if (newCoupons.length > limit) {
                return  newCoupons;
            }

            // newCouponCount++;
        }
    };

    Coupon.fetchAllWithIds = (couponIds) => {
        if (!couponIds) {
            return Promise.resolve(null);
        }

        return Coupon.findAll({
            where: {
                id: couponIds
            }
        });
    };

    function shareableCouponBody(id) {
        return {
            id: id,
            discountBookingFee: true,
            redemptions: 0,
            name: 'Shared coupon',
            maxRedemptions: 1,
            isCorporate: false,
            redeemBy: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        }
    }

    return Coupon;
};

module.exports = coupon;
