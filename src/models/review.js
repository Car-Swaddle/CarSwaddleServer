const review = function (sequelize, DataTypes) {
    const Review = sequelize.define('review', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        rating: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        text: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reviewerID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        revieweeID: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, {
        freezeTableName: true,
    });

    Review.associate = models => {
        Review.belongsTo(models.User, { foreignKey: 'userID', allowNull: true, constraints: false });
        Review.belongsTo(models.Mechanic, { foreignKey: 'mechanicID', allowNull: true, constraints: false });
        Review.belongsTo(models.AutoService, { foreignKey: 'autoServiceIDFromUser', as: 'autoServiceFromUser', allowNull: true, constraints: false });
        Review.belongsTo(models.AutoService, { foreignKey: 'autoServiceIDFromMechanic', as: 'autoServiceFromMechanic', allowNull: true, constraints: false });
    };

    return Review;
};

module.exports = review;