var apnFramework = require('apn');

var carSwaddleOptions = {
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
        this.carSwaddleProvider = new apnFramework.Provider(carSwaddleOptions);
        this.carSwaddleMechanicProvider = new apnFramework.Provider(carSwaddleOptions);
    }

    sendUserNotification(user, alert, body, payload, badge, title) {
        return user.getDeviceTokens().then(tokens => {
            tokens.forEach(token => {
                let notification = this.createNotification(alert, body, payload, badge, title);
                notification.topic = carSwaddleBundleID;
                this.carSwaddleProvider.send(notification, token.token).then(result => {
                    console.log(result);
                });
            });
        });
    }

    sendMechanicNotification(mechanic, alert, body, payload, badge, title) {
        return mechanic.getDeviceTokens().then(tokens => {
            tokens.forEach(token => {
                var notification = this.createNotification(alert, body, payload, badge, title);
                notification.topic = carSwaddleMechanicBundleID;
                this.carSwaddleMechanicProvider.send(notification, token.token).then(result => {
                    console.log(result);
                });
            });
        });
    }

    sendMechanicFullNotification() {
        
    }

    createNotification(alert, body, payload, badge, title) {
        var notification = new apnFramework.Notification();
        notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
        notification.badge = badge;
        notification.title = title;
        notification.body = alert;
        notification.sound = "default";
        // notification.alert = alert;
        notification.payload = payload;
        return notification
    }

}

const apn = new PushService();

module.exports = apn;
