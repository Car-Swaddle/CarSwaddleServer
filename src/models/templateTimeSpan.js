const templateTimeSpan = function (sequelize, DataTypes) {
    const TemplateTimeSpan = sequelize.define('templateTimeSpan', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        // The second of the day 
        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        /// Sunday = 0
        weekDay: {
            type: DataTypes.SMALLINT,
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
        TemplateTimeSpan.belongsTo(models.Mechanic, { 
            foreignKey: {
                name: 'mechanicID',
                allowNull: true
            }
        });
    };

    TemplateTimeSpan.getStartTimeDate = function(seconds) {
        var hour = Math.floor(seconds / (60*60));
        var minute = Math.floor((seconds%(60*60))/60);
        var second = seconds%60;
        var date = new Date(Date.UTC(0, 1, 1, hour, minute, second));
        return date;
    }

    TemplateTimeSpan.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());
        // var mechanicID = values.templateTimeSpanID;
        // delete values.templateTimeSpanID;
        // values.mechanicID = mechanicID;
        return values;
    }

    return TemplateTimeSpan;
};

module.exports = templateTimeSpan;