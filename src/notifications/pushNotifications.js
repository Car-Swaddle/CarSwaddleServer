var apnFramework = require('apn');
var dateFormat = require('dateformat');

var carSwaddleProductionOptions = {
    token: {
        key: "src/resources/CarSwaddleAPNSKey.p8",
        keyId: "G665BU53V8",
        teamId: "977533WLK8",
    },
    production: true
}; // Y3N72N8FST

var carSwaddleDebugOptions = {
    token: {
        key: "src/resources/CarSwaddleAPNSKey.p8",
        keyId: "G665BU53V8",
        teamId: "977533WLK8",
    },
    production: false
};


const carSwaddleBundleID = "com.carswaddle.carswaddle";
const carSwaddleMechanicBundleID = "com.carswaddle.carswaddlemechanic";

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
        const name = autoService.mechanic.user.firstName
        const text = name + ', you have an oil change coming up: ' + dateString;
        const payload = {
            'type': 'reminder', 
            'date': autoService.scheduledDate,
            'name': name,
        };
        this.sendMechanicNotification(autoService.mechanic, text, payload, null, subject);
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
        // notification.title = title;
        // notification.body = body;
        notification.sound = "default";
        notification.mutableContent = true;
        notification.alert = { 'title': title, 'body': body };
        // notification.alert.title = payload;
        // notification.alert.body = body;
        // notification.payload = payload;
        notification.payload = payload;
        return notification
    }

}

const apn = new PushService();

module.exports = apn;
