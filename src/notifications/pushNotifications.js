var apnFramework = require('apn');
var dateFormat = require('dateformat');

var carSwaddleProductionOptions = {
    token: {
        key: "src/resources/CarSwaddleAPNSKey.p8",
        keyId: "Y3N72N8FST",
        teamId: "MG7WLQ6J4A",
    },
    production: true
};

var carSwaddleDebugOptions = {
    token: {
        key: "src/resources/CarSwaddleAPNSKey.p8",
        keyId: "Y3N72N8FST",
        teamId: "MG7WLQ6J4A",
    },
    production: false
};


const carSwaddleBundleID = "CS.CarSwaddle";
const carSwaddleMechanicBundleID = "CS.CarSwaddleMechanic";

class PushService {

    constructor() {
        this.carSwaddleProviderProduction = new apnFramework.Provider(carSwaddleProductionOptions);
        this.carSwaddleMechanicProviderProduction = new apnFramework.Provider(carSwaddleProductionOptions);
        this.carSwaddleProviderDebug = new apnFramework.Provider(carSwaddleDebugOptions);
        this.carSwaddleMechanicProviderDebug = new apnFramework.Provider(carSwaddleDebugOptions);
    }

    sendUserReminderNotification(autoService) {
        const subject = "Upcoming Oil Change";
        const dateString = dateFormat(autoService.scheduledDate, "dddd, mmmm dS, h:MM TT Z");
        const text = autoService.user.firstName + ', you have an oil change coming up: ' + dateString;
        this.sendUserNotification(autoService.user, text, null, null, subject);
    }

    sendMechanicReminderNotification(autoService) {
        const subject = "Upcoming Oil Change";
        const dateString = dateFormat(autoService.scheduledDate, "dddd, mmmm dS, h:MM TT Z");
        const text = autoService.mechanic.user.firstName + ', you have an oil change coming up: ' + dateString;
        this.sendMechanicNotification(autoService.mechanic, text, null, null, subject);
    }

    sendUserNotification(user, body, payload, badge, title) {
        return user.getDeviceTokens().then(tokens => {
            tokens.forEach(token => {
                let notification = this.createNotification(body, payload, badge, title);
                notification.topic = carSwaddleBundleID;
                this.carSwaddleProviderProduction.send(notification, token.token).then(result => {
                    console.log(result);
                });
                this.carSwaddleProviderDebug.send(notification, token.token).then(result => {
                    console.log(result);
                });
            });
        });
    }

    sendMechanicNotification(mechanic, body, payload, badge, title) {
        return mechanic.getDeviceTokens().then(tokens => {
            tokens.forEach(token => {
                var notification = this.createNotification(body, payload, badge, title);
                notification.topic = carSwaddleMechanicBundleID;
                this.carSwaddleMechanicProviderProduction.send(notification, token.token).then(result => {
                    console.log(result);
                });
                this.carSwaddleMechanicProviderDebug.send(notification, token.token).then(result => {
                    console.log(result);
                });
            });
        });
    }

    createNotification(body, payload, badge, title) {
        var notification = new apnFramework.Notification();
        notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
        notification.badge = badge;
        notification.title = title;
        notification.body = body;
        notification.sound = "default";
        // notification.alert = alert;
        notification.payload = payload;
        return notification
    }

}

const apn = new PushService();

module.exports = apn;
