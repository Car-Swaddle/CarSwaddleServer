const templateTimeSpan = function (sequelize, DataTypes) {
    const TemplateTimeSpan = sequelize.define('templateTimeSpan', {
        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        weekDay: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
        duration: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
    });

    TemplateTimeSpan.associate = models => {
        TemplateTimeSpan.belongsTo(models.Mechanic, { foreignKey: 'templateTimeSpanID' });
        TemplateTimeSpan.hasOne(models.Location, { foreignKey: 'locationID' });
    };

    return TemplateTimeSpan;
};

module.exports = templateTimeSpan;