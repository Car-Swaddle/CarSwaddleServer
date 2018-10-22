const templateTimeSpan = function (sequelize, DataTypes) {
    const TemplateTimeSpan = sequelize.define('templateTimeSpan', {
        // The minute of the day 
        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        /// Sunday = 0
        weekDay: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
        // number of seconds
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
    };

    TemplateTimeSpan.getStartTimeDate = function(seconds) {
        var hour = Math.floor(seconds / (60*60));
        var minute = Math.floor((seconds%(60*60))/60);
        var second = seconds%60;
        var date = new Date(0, 1, 1, hour, minute, second);
        return date;
    }

    return TemplateTimeSpan;
};

module.exports = templateTimeSpan;