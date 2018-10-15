const autoService = function (sequelize, DataTypes) {
  const AutoService = sequelize.define('autoService', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('oilChange')
    },
    scheduledDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'inProgress', 'finished', 'canceled'),
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true
    },
  },
    {
      freezeTableName: true,
    });

  AutoService.associate = models => {
    AutoService.belongsTo(models.User, { as: 'performServices' });
    AutoService.belongsTo(models.User, { as: 'requestServices' });
    AutoService.hasOne(models.Location, { as: 'location' });
  };

  AutoService.STATUS = {
    scheduled: 'scheduled',
    inProgress: 'inProgress',
    finished: 'finished',
    canceld: 'canceled',
  };

  AutoService.isValidStatus = function (status) {
    if (AutoService.Status.scheduled == status ||
    AutoService.Status.inProgress == status ||
    AutoService.Status.finished == status ||
    AutoService.Status.canceled == status) {
      return true;
    } else {
      return false;
    }
  };

  AutoService.TYPE = {
    oilChange: 'oilChange',
  };

  AutoService.isValidType = function (type) {
    if (AutoService.TYPE.oilChange == type) {
      return true;
    } else {
      return false;
    }
  };

  return AutoService;
};



module.exports = autoService;
