
const haversineR = 6371e3;

module.exports = {
    metersBetween: function (point1, point2) {
        const lat1 = point1.latitude;
        const lat2 = point2.latitude;
    
        const lon1 = point1.longitude;
        const lon2 = point2.longitude;
    
        var φ1 = this.degreesToRadians(lat1);
        var φ2 = this.degreesToRadians(lat2);
        var Δφ = this.degreesToRadians(lat2 - lat1);
        var Δλ = this.degreesToRadians(lon2 - lon1);
    
        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
        return haversineR * c;
    },
    degreesToRadians: function (degrees) {
        var pi = Math.PI;
        return degrees * (pi / 180);
    }
}
