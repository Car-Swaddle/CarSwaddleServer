const constants = require('./constants.js');
const { Op } = require('sequelize');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const pushService = require('../notifications/pushNotifications.js');
const distance = require('../routes/distance.js');
const { DateTime } = require('luxon');
const reminderFile = require('../notifications/reminder.js');
const stripeChargesFile = require('../controllers/stripe-charges.js');
const emailFile = require('../notifications/email.js');

module.exports = function (models) {
    return new AutoServiceScheduler(models);
};

function AutoServiceScheduler(models) {
    this.models = models;
    this.reminder = new reminderFile(models);
    this.stripeCharges = stripeChargesFile(models);
    this.emailer = new emailFile(models);
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

AutoServiceScheduler.prototype.scheduleAutoService = async function (user, status, scheduledDate, vehicleID, mechanicID, sourceID,
    prices, oilType, serviceEntities, location, locationID, taxRate,
    couponID, payStructureID, referrerID, usePaymentIntent, notes, callback) {
    
    var paymentIntentID = null;
    const mechanicTransferAmount = prices.transferAmount;
    var referrerTransferAmount = null;
    var autoService = null;
    var transaction = await this.models.sequelize.transaction();
    const mechanic = await this.models.Mechanic.findByPk(mechanicID);

    try {

        if (payStructureID) {
            console.info(`Using payment intents for this user ${user.id} with ties to pay structure ${payStructureID}`)
            const payStructure = await this.models.PayStructure.findByPk(payStructureID);
            referrerTransferAmount = Math.abs(prices.bookingFee + prices.bookingFeeDiscount) * payStructure.percentageOfProfit;
            if (referrerTransferAmount > (prices.subTotal * 0.5)) {
                // Sanity check, should never be above 50% of our cost for a referrer
                console.warn(`Referrer transfer amount was over 50%, check for user ${user.id}, pay structure ${payStructureID}`)
                referrerTransferAmount = prices.subTotal * 0.5;
            }
            referrerTransferAmount = referrerTransferAmount >= 0 ? referrerTransferAmount : 0;
        }

        autoService = await this.createAutoService(user, mechanicID, status, scheduledDate, vehicleID, invoice, transfer, prices.transferAmount, sourceID, serviceEntities, locationID, location, couponID, notes, transaction);

        await this.setupServiceEntities(serviceEntities, autoService, transaction);

        // Refetch to get all relationships
        autoService = await this.models.AutoService.findOne({
            where: { id: autoService.id },
            transaction: transaction,
            include: this.includeDict(),
        });

        if (usePaymentIntent) {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: prices.total,
                currency: 'usd',
                payment_method: sourceID,
                customer: user.stripeCustomerID,
                transfer_group: autoService.id,
                metadata: {
                    user_id: user.id,
                    mechanic_id: mechanicID,
                    vehicle_id: vehicleID,
                    scheduled_date: scheduledDate
                }
            });
            paymentIntentID = paymentIntent.id;
        } else {
            var invoice = await this.stripeCharges.updateDraft(user.stripeCustomerID, prices, {
                transferAmount: prices.transferAmount,
                mechanicCost: prices.mechanicCost,
                mechanicID,
                oilType,
            }, taxRate);
            var { invoice, transfer } = await this.stripeCharges.payInvoices(invoice.id, sourceID, mechanicID, prices.transferAmount);
        }

        await this.createTransactionMetadata(mechanic, autoService.location, prices.mechanicCost, autoService,
            paymentIntentID, couponID, referrerID, payStructureID, mechanicTransferAmount, referrerTransferAmount, transaction);

        if (usePaymentIntent) {
            await stripe.paymentIntents.confirm(paymentIntentID);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error(`Unable to complete schedule for user ${user.id}: ${error} ${error.stack}`)
        callback(error, null);
        return;
    }

    // Everything completed successfully - send notifications
    this.sendNotification(user, mechanic, autoService);
    this.reminder.scheduleRemindersForAutoService(autoService);    
    callback(null, autoService);
}

AutoServiceScheduler.prototype.sendNotification = function (user, mechanic, autoService) {
    pushService.sendMechanicUserScheduledAppointment(user, mechanic, autoService);
    this.emailer.sendMechanicNewServiceEmail(user, mechanic, autoService);
}

AutoServiceScheduler.prototype.setupServiceEntities = async function (serviceEntities, autoService, transaction) {
    var entityTypeToSpecificEntities = {};

    for (var i = 0; i < serviceEntities.length; i++) {
        var val = serviceEntities[i];
        const entityType = val.entityType;
        if (entityTypeToSpecificEntities[entityType] == null) {
            entityTypeToSpecificEntities[entityType] = []
        }
        entityTypeToSpecificEntities[entityType].push(val.specificService);
    }

    var serviceEntityPromises = [];
    var keys = Object.keys(entityTypeToSpecificEntities)
    for (var i = 0; i < keys.length; i++) {
        const key = keys[i];
        var specificServices = entityTypeToSpecificEntities[key];
        for (var j = 0; j < specificServices.length; j++) {
            if (key == 'OIL_CHANGE') {
                const specificService = specificServices[j];
                const p = this.createOilChange(specificService, key, autoService, transaction);
                serviceEntityPromises.push(p);
            }
        }
    }

    const values = await Promise.all(serviceEntityPromises);
    if (values == null) {
        throw('unable to create service entities')
    }
}

AutoServiceScheduler.prototype.createOilChange = async function (service, key, autoService, transaction) {
    const oilChange = await this.models.OilChange.create({
        id: uuidV1(),
        oilType: service.oilType
    }, { transaction: transaction});

    const serviceEntity = await this.models.ServiceEntity.create({
        id: uuidV1(),
        entityType: key,
        autoService: autoService,
        oilChange: oilChange
    }, { transaction: transaction});
    
    // Do we need this? Seems like they should be set above
    serviceEntity.setOilChange(oilChange);
    serviceEntity.setAutoService(autoService);
    await serviceEntity.save({transaction: transaction});
}

AutoServiceScheduler.prototype.createAutoService = async function (user, mechanicID, status, scheduledDate, vehicleID, invoice, transfer, transferAmount, sourceID, serviceEntities, locationID, location, couponID, notes, transaction) {
    if (this.models.AutoService.isValidStatus(status) == false) { 
        throw('Invalid status:' + status);
    }
    if (!scheduledDate) {
        throw('invalid parameters, scheduledDate');
    }

    const inTimeSlot = await this.isDateInMechanicSlot(scheduledDate, user, mechanicID);
    const isAlreadyScheduled = await this.isDatePreviouslyScheduled(scheduledDate, user, mechanicID);

    if (this.isValidScheduledDate(scheduledDate, user) == false || inTimeSlot == false || isAlreadyScheduled == true) {
        throw('invalid parameters, scheduledDate is not available or an invalid date');
    }

    if (!vehicleID) { throw('invalid parameters, vehicleID'); }
    if (!sourceID) { throw('invalid parameters, sourceID'); }
    if (serviceEntities.length <= 0) { throw('invalid parameters, at least one serviceEntities'); }

    var locationPromise = null;
    if (locationID != null) {
        locationPromise = this.models.Location.findByPk(locationID, {transaction: transaction});
    } else if (location != null && location.latitude != null && location.longitude != null) {
        var point = { type: 'Point', coordinates: [location.longitude, location.latitude] };
        locationPromise = this.models.Location.create({
            point: point,
            streetAddress: location.streetAddress,
            id: uuidV1(),
        }, {transaction: transaction});
    } else {
        throw('invalid parameters, need locationID or location');
    }

    if (!mechanicID) { throw('invalid parameters, mechanicID'); }

    const fetchedLocation = await locationPromise;
    if (!fetchedLocation) { throw('invalid parameters, no location'); }
    const mechanic = await this.models.Mechanic.findByPk(mechanicID, {transaction: transaction});
    if (!mechanic) { throw('invalid parameters, no location'); }
    const vehicle = await this.models.Vehicle.findByPk(vehicleID, {transaction: transaction});
    if (!vehicle) { throw('invalid parameters, no location'); }

    const autoService = await this.models.AutoService.create({
        id: uuidV1(),
        status: status,
        notes: notes,
        scheduledDate: scheduledDate,
        invoiceID: invoice ? invoice.id : "",
        chargeID: invoice ? invoice.charge : "",
        transferID: transfer && transfer.id,
        balanceTransactionID: transfer && transfer.destination_payment.balance_transaction,
        transferAmount: transferAmount,
        couponID: couponID,
        mechanicID: mechanic.id,
        userID: user.id,
        vehicleID: vehicle.id,
    }, {transaction: transaction});

    await fetchedLocation.setAutoService(autoService.id, {transaction: transaction});

    // // TODO - save these in the above create
    // autoService.setMechanic(mechanic, { save: false });
    // autoService.setUser(user, { save: false });
    // autoService.setVehicle(vehicle, { save: false });
    // autoService.setLocation(fetchedLocation, { save: false });
    // return await autoService.save({transaction: transaction});
    return autoService;
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
            mechanicID: mechanicID,
            [Op.and]: [{
                [Op.or]: [{
                    status: 'scheduled'
                }, {
                    status: 'inProgress'
                }, {
                    status: 'completed'
                }]
            }]
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

AutoServiceScheduler.prototype.createTransactionMetadata = async function (mechanic, location, mechanicCost, autoService, 
    paymentIntentID, couponID, referrerID, payStructureID, mechanicTransferAmount, referrerTransferAmount, transaction) {
    const region = await mechanic.getRegion();
    if (!region) { throw('unable to get region'); }
    const locationPoint = { latitude: location.point.coordinates[1], longitude: location.point.coordinates[0] };
    const regionPoint = { latitude: region.origin.coordinates[1], longitude: region.origin.coordinates[0] };
    const meters = distance.metersBetween(locationPoint, regionPoint);

    const transactionMetadata = await this.models.TransactionMetadata.create({
        id: uuidV1(),
        stripeTransactionID: autoService.balanceTransactionID,
        mechanicCost: mechanicCost,
        drivingDistance: meters,
        stripePaymentIntentID: paymentIntentID,
        couponID: couponID,
        referrerID: referrerID,
        payStructureID: payStructureID,
        mechanicTransferAmount: mechanicTransferAmount,
        referrerTransferAmount: referrerTransferAmount,
        autoServiceID: autoService.id,
        mechanicID: mechanic.id,

    }, {transaction: transaction});

    if (!transactionMetadata) { throw('unable to get transactionMetadata') }
    // transactionMetadata.setAutoService(autoService, { save: false });
    // transactionMetadata.setMechanic(mechanic, { save: false });
    // autoService.transactionMetadata = transactionMetadata;

    // // TODO - do we need a double save here?
    // await transactionMetadata.save({transaction: transaction});
    // await autoService.save({transaction: transaction});

    return transactionMetadata;
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
        { model: this.models.Vehicle, include: [this.models.VehicleDescription] },
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
