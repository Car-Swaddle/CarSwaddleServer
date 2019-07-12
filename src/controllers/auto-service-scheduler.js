const constants = require('./constants.js');
const { Op } = require('sequelize');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const pushService = require('../notifications/pushNotifications.js');
const distance = require('../routes/distance.js');
const { DateTime } = require('luxon');
const reminderFile = require('../notifications/reminder.js');
const stripeChargesFile = require('../controllers/stripe-charges.js');

module.exports = function (models) {
    return new AutoServiceScheduler(models);
};

function AutoServiceScheduler(models) {
    this.models = models;
    this.reminder = new reminderFile(models);
    this.stripeCharges = stripeChargesFile(models);
    this.init();
}

AutoServiceScheduler.prototype.init = function () {

};

AutoServiceScheduler.prototype.findAutoService = function (autoServiceID, callback) {
    this.models.AutoService.findOne({
        where: { id: autoServiceID },
        include: this.includeDict(),
    }).then(autoService => {
        callback(null, autoService);
    }).catch(err => {
        callback(err, null);
    });
};

AutoServiceScheduler.prototype.findAutoServices = function (mechanicID, userID, limit, offset, filterStatus, sortStatus, startDate, endDate, autoServiceID, callback) {
    sortStatus = sortStatus || []

    if (Array.isArray(sortStatus) == false && sortStatus != null) {
        sortStatus = [sortStatus];
    }

    var order = this.autoServiceOrder(sortStatus);

    this.models.AutoService.findAll({
        where: this.autoServiceWhereDict(mechanicID, userID, filterStatus, startDate, endDate, autoServiceID),
        order: order,
        limit: limit,
        offset: offset,
        include: this.includeDict(),
    }).then(autoServices => {
        callback(null, autoServices);
    }).catch(err => {
        callback(err, null);
    });
};

AutoServiceScheduler.prototype.scheduleAutoService = async function (user, status, scheduledDate, vehicleID, mechanicID, invoice, sourceID, serviceEntities, location, locationID, notes, callback) {
    this.createAutoService(user, mechanicID, status, scheduledDate, vehicleID, invoice, sourceID, serviceEntities, locationID, location, notes, async (err, autoService) => {
        if (err) {
            callback(err, null);
            return;
        }

        const { invoice, transfer } = await this.stripeCharges.payInvoices(sourceID, autoService.id);

        if (!invoice) {
            callback('unable to create charge', null);
            return
        }

        this.setupServiceEntities(serviceEntities, autoService, async (err, serviceEntities) => {
            const fetchedAutoService = await this.models.AutoService.findOne({
                where: { id: autoService.id },
                include: this.includeDict(),
            });

            const mechanic = await this.models.Mechanic.findById(mechanicID);
            this.sendNotification(user, mechanic);
            this.reminder.scheduleRemindersForAutoService(fetchedAutoService);

            fetchedAutoService.balanceTransactionID = transfer && transfer.destination_payment.balance_transaction;
            fetchedAutoService.chargeID = invoice.charge;
            await fetchedAutoService.save()

            this.createTransactionMetadata(mechanic, fetchedAutoService.location, transfer, fetchedAutoService, fetchedAutoService.balanceTransactionID, async (err, transactionMetadata) => {
                const lastAutoService = await this.models.AutoService.findOne({
                    where: { id: fetchedAutoService.id },
                    include: this.includeDict(),
                });

                callback(err, lastAutoService);
            });
        });
    });
}

AutoServiceScheduler.prototype.sendNotification = function (user, mechanic) {
    const displayName = user.displayName();
    const alert = displayName + ' scheduled an appointment';
    pushService.sendMechanicNotification(mechanic, alert, null, null, null);
}

AutoServiceScheduler.prototype.setupServiceEntities = async function (serviceEntities, autoService, callback) {
    var entityTypeToSpecificEntities = {};

    for (i = 0; i < serviceEntities.length; i++) {
        var val = serviceEntities[i];
        const entityType = val.entityType;
        if (entityTypeToSpecificEntities[entityType] == null) {
            entityTypeToSpecificEntities[entityType] = []
        }
        entityTypeToSpecificEntities[entityType].push(val.specificService);
    }

    var serviceEntityPromises = [];
    var keys = Object.keys(entityTypeToSpecificEntities)
    for (i = 0; i < keys.length; i++) {
        const key = keys[i];
        var specificServices = entityTypeToSpecificEntities[key];
        for (j = 0; j < specificServices.length; j++) {
            if (key == 'OIL_CHANGE') {
                const specificService = specificServices[j];
                const p = this.createOilChange(specificService, key, autoService);
                serviceEntityPromises.push(p);
            }
        }
    }

    const values = await Promise.all(serviceEntityPromises);
    var err = values == null ? 'unable to create service entities' : null;
    callback(err, values);
}

AutoServiceScheduler.prototype.createOilChange = function (service, key, autoService) {
    const self = this;
    return this.models.OilChange.create({
        id: uuidV1(),
        oilType: service.oilType
    }).then(oilChange => {
        return self.models.ServiceEntity.create({
            id: uuidV1(),
            entityType: key,
            autoService: autoService,
            oilChange: oilChange
        }).then(serviceEntity => {
            serviceEntity.setOilChange(oilChange);
            serviceEntity.setAutoService(autoService);
            return serviceEntity.save();
        });
    })
}

AutoServiceScheduler.prototype.createAutoService = async function (user, mechanicID, status, scheduledDate, vehicleID, invoice, sourceID, serviceEntities, locationID, location, notes, callback) {
    if (this.models.AutoService.isValidStatus(status) == false) { callback('Invalid status:' + status, null); return; }
    if (!scheduledDate) { callback('invalid parameters, scheduledDate', null); return; }

    const inTimeSlot = await this.isDateInMechanicSlot(scheduledDate, user, mechanicID);
    const isAlreadyScheduled = await this.isDatePreviouslyScheduled(scheduledDate, user, mechanicID);

    if (this.isValidScheduledDate(scheduledDate, user) == false || inTimeSlot == false || isAlreadyScheduled == true) {
        callback('invalid parameters, scheduledDate is not available or an invalid date', null);
        return;
    }

    if (!vehicleID) { callback('invalid parameters, vehicleID', null); return; }
    if (!invoice) { callback('invalid parameters, invoice'); return; }
    if (!sourceID) { callback('invalid parameters, sourceID'); return; }
    if (serviceEntities.length <= 0) { callback('invalid parameters, at least one serviceEntities', null); return; }

    var locationPromise = null;
    if (locationID != null) {
        locationPromise = this.models.Location.findById(locationID);
    } else if (location != null && location.latitude != null && location.longitude != null) {
        var point = { type: 'Point', coordinates: [location.longitude, location.latitude] };
        locationPromise = this.models.Location.create({
            point: point,
            streetAddress: location.streetAddress,
            id: uuidV1(),
        });
    } else {
        callback('invalid parameters, need locationID or location', null);
        return;
    }

    if (!mechanicID) { callback('invalid parameters, mechanicID', null); return; }

    const fetchedLocation = await locationPromise;
    if (!fetchedLocation) { callback('invalid parameters, no location', null); return; }
    const mechanic = await this.models.Mechanic.findById(mechanicID);
    if (!mechanic) { callback('invalid parameters, no location', null); return; }
    const vehicle = await this.models.Vehicle.findById(vehicleID);
    if (!vehicle) { callback('invalid parameters, no location', null); return; }

    const autoService = await this.models.AutoService.create({
        id: uuidV1(),
        status: status,
        notes: notes,
        scheduledDate: scheduledDate,
        invoiceID: invoice.id,
    });
    autoService.setMechanic(mechanic, { save: false });
    autoService.setUser(user, { save: false });
    autoService.setVehicle(vehicle, { save: false });
    autoService.setLocation(fetchedLocation, { save: false });
    const newAutoService = await autoService.save();
    callback(null, newAutoService);
}

AutoServiceScheduler.prototype.isValidScheduledDate = function (scheduledDateString, user) {
    const scheduledDate = new Date(scheduledDateString);
    const scheduledDateTime = DateTime.fromJSDate(scheduledDate, { setZone: true, zone: user.timeZone || 'America/Denver' });
    const currentDateTime = DateTime.fromJSDate(new Date(), { setZone: true, zone: user.timeZone || 'America/Denver' });

    if (currentDateTime.hasSame(scheduledDateTime, 'day') == false && currentDateTime < scheduledDateTime) {
        return true;
    } else {
        return false;
    }
}

AutoServiceScheduler.prototype.isDatePreviouslyScheduled = async function (scheduledDate, user, mechanicID) {
    // const scheduledWeekday = scheduledDate
    // const scheduledDateTime = DateTime.fromJSDate(scheduledDate, { setZone: true, zone: user.timeZone || 'America/Denver' });
    // const startOfDay = scheduledDate.startOf('day');
    // const seconds = scheduledDateTime.diff(startOfDay, 'seconds');

    const autoService = await this.models.AutoService.findOne({
        where: {
            scheduledDate: scheduledDate,
            mechanicID: mechanicID
        }
    });
    return autoService != null
}

AutoServiceScheduler.prototype.isDateInMechanicSlot = async function (scheduledDateString, user, mechanicID) {
    const scheduledDate = new Date(scheduledDateString)
    const scheduledWeekday = scheduledDate.getDay();
    const scheduledDateTime = DateTime.fromJSDate(scheduledDate, { setZone: true, zone: user.timeZone || 'America/Denver' });
    const startOfDay = scheduledDateTime.startOf('day');
    const diff = scheduledDateTime.diff(startOfDay, 'seconds');

    var startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // diff.seconds

    var endDate = new Date();
    endDate.setHours(24, 0, 0, 0); // diff.seconds

    const daDate = new Date(Date.UTC(0, 1, 1, 0, 0, diff.seconds))

    const timeSpan = await this.models.TemplateTimeSpan.findOne({
        where: {
            weekDay: scheduledWeekday,
            startTime: daDate,
            mechanicID: mechanicID
        }
    });

    // const timeSpans = await this.models.TemplateTimeSpan.findAll({
    //     where: {
    //         weekDay: scheduledWeekday,
    //         mechanicID: mechanicID
    //     }
    // });
    // console.log(timeSpans);

    return timeSpan != null
}

AutoServiceScheduler.prototype.createTransactionMetadata = async function (mechanic, location, transfer, autoService, stripeTransactionID, callback) {
    const region = await mechanic.getRegion();
    if (!region) { callback('unable to get region', null) }
    const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
    const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
    const meters = distance.metersBetween(locationPoint, regionPoint);

    const mechanicCost = Math.round(transfer.amount * .7);

    const transactionMetadata = await this.models.TransactionMetadata.create({ id: uuidV1(), stripeTransactionID: stripeTransactionID, mechanicCost: mechanicCost, drivingDistance: meters });
    if (!transactionMetadata) { callback('unable to get transactionMetadata', null) }
    transactionMetadata.setAutoService(autoService, { save: false });
    transactionMetadata.setMechanic(mechanic, { save: false });
    autoService.transactionMetadata = transactionMetadata;
    await transactionMetadata.save();
    await autoService.save();

    callback(null, transactionMetadata);
}


AutoServiceScheduler.prototype.autoServiceOrder = function (sortStatus) {
    var order;
    if (sortStatus == null && sortStatus.length != 0) {
        if (this.models.AutoService.areValidStatuses(sortStatus) == false) {
            return [];
        }
        var queryString = this.models.AutoService.rawStatusQueryString(sortStatus);
        order = [[this.models.sequelize.literal(queryString)], ['scheduledDate', 'DESC']]
    } else {
        order = [['scheduledDate', 'DESC']];
    }
    return order;
}

AutoServiceScheduler.prototype.includeDict = function () {
    return [
        { model: this.models.User, attributes: this.models.User.defaultAttributes, },
        this.models.Location,
        { model: this.models.ServiceEntity, include: [this.models.OilChange] },
        this.models.Vehicle,
        {
            model: this.models.Mechanic,
            include: [
                {
                    model: this.models.User,
                    attributes: this.models.User.defaultAttributes,
                }
            ],
        },
        this.reviewIncludeDict('reviewFromUser'),
        this.reviewIncludeDict('reviewFromMechanic'),
    ];
};


AutoServiceScheduler.prototype.reviewIncludeDict = function (as) {
    return {
        model: this.models.Review,
        attributes: ['id', 'rating', 'text', 'reviewerID', 'revieweeID', 'createdAt'],
        as: as,
        include: [
            { model: this.models.User, attributes: ['id'] },
            { model: this.models.Mechanic, attributes: ['id'] }
        ],
    }
};

AutoServiceScheduler.prototype.autoServiceWhereDict = function (mechanicID, userID, status, startDate, endDate, autoServiceID) {
    var whereDict = {
    }

    if (startDate != null && endDate != null) {
        whereDict.scheduledDate = {
            "$between": [startDate, endDate]
        };
    }
    if (mechanicID != null) {
        whereDict.mechanicID = mechanicID;
    }
    if (userID != null) {
        whereDict.userID = userID;
    }
    if (status != null) {
        whereDict.status = {
            [Op.or]: status
        }
    }

    if (autoServiceID != null) {
        whereDict.id = autoServiceID
    }

    return whereDict;
}
