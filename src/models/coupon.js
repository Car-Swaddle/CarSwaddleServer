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
        maxRedemptionsPerUser: {
            type: DataTypes.INTEGER,
            allowNull: true,
            default: 1
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
        Coupon.belongsTo(models.Referrer, { foreignKey: 'referrerID', allowNull: true })
    };

    Coupon.findRedeemable = async (couponId, currentUserId, mechanicId) => {
        if (couponId == undefined) {
            return { coupon: null, error };
        }
        const coupon = await Coupon.findOne({
            where: {
                id: couponId
            }
        });
        var error = null;

        if (!coupon) {
            error = 'INCORRECT_CODE';
        } else if (coupon.redeemBy && coupon.redeemBy.getTime() < Date.now()) {
            error = 'EXPIRED';
        } else if (!coupon.isCorporate && coupon.createdByUserID && coupon.createdByUserID === currentUserId) {
            error = 'SELF_REDEEM';
        } else if (!coupon.isCorporate && coupon.createdByMechanicID && coupon.createdByMechanicID !== mechanicId) {
            error = 'INCORRECT_MECHANIC';
        } else if (coupon.redemptions >= coupon.maxRedemptions) {
            error = 'DEPLETED_REDEMPTIONS';
        }

        return { coupon: error == null ? coupon : null, error };
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

    Coupon.redeem = (couponId, transaction) => {
        if (!couponId) {
            return Promise.resolve(null);
        }

        var updateOptions = {
            where: {
                id: couponId
            }
        }
        if (transaction) {
            updateOptions.transaction = transaction;
        }

        const update = Coupon.update({
            redemptions: sequelize.literal('redemptions + 1')
        }, updateOptions);

        return update.then(res => {
            return res[0] === 1
                ? Coupon.findByPk(couponId)
                : null;
        });
    };

    Coupon.fetchOrCreateShareableCoupons = async (userId, count) => {
        if (!userId) {
            return;
        }

        const limit = count || 3;

        const coupons = await Coupon.findAll({
            where: { createdByUserID: userId },
            limit: limit,
            order: [['createdAt', 'ASC']],
        });

        const leftToCreateCount = limit - (coupons.length || 0);
        if (leftToCreateCount == 0) {
            return coupons;
        }

        var formattedUserIds = [];
        for (var i = 0; i < Math.max(leftToCreateCount * 2, 30); i++) {
            const randomNumber = Math.round(Math.random() * (9999999999999 - 0) + 0);
            const hashId = hashids.encode(randomNumber);
            formattedUserIds.push(hashId);
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

        var newCouponPromises = [];
        for (var key in formattedUserIdsDict) {
            if (newCouponPromises.length >= leftToCreateCount) {
                break;
            }

            const couponId = (key || '').replace(/\W/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
            const newCouponPromise = await Coupon.create(shareableCouponBody(couponId, userId));
            newCouponPromises.push(newCouponPromise);
        }

        const newCoupons = await Promise.all(newCouponPromises);

        return newCoupons.concat(coupons);
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

    function shareableCouponBody(id, creatorId) {
        return {
            id: id,
            discountBookingFee: true,
            redemptions: 0,
            name: 'Shared coupon',
            maxRedemptions: 1,
            isCorporate: false,
            redeemBy: new Date(new Date().setFullYear(new Date().getFullYear() + 100)),
            createdByUserID: creatorId
        }
    }

    return Coupon;
};

module.exports = coupon;
