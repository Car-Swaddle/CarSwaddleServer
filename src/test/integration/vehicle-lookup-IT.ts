export{}
const assert = require('chai').assert
var request = require('supertest');

var host_url = process.env.HOST_URL;
var jwt = process.env.TEST_JWT;
let host_request = request(host_url);
describe('Vehicle lookup api', function() {

    it('Should return makes from api', function() {
        return host_request.get('/api/vehicle/lookup/MAKE?make=Toy')
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then(resp => {
            assert.include(resp.body, 'Toyota');
        })
    });

    it('Should return model from api (no model)', function() {
        return host_request.get('/api/vehicle/lookup/MODEL?make=Toyota')
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then(resp => {
            assert.include(resp.body, 'Corolla');
        })
    });

    it('Should return model from api (partial model)', function() {
        return host_request.get('/api/vehicle/lookup/MODEL?make=Toyota&model=Coro')
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then(resp => {
            assert.include(resp.body, 'Corolla');
        })
    });

    it('Should return model from api (full model)', function() {
        return host_request.get('/api/vehicle/lookup/MODEL?make=Toyota&model=Corolla')
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then(resp => {
            assert.include(resp.body, 'Corolla');
        })
    });

    it('Should return years from api', function() {
        return host_request.get('/api/vehicle/lookup/YEAR?make=Toyota&model=Corolla')
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then(resp => {
            assert.include(resp.body, 2018);
        })
    });

    it('Should return engine from api', function() {
        return host_request.get('/api/vehicle/lookup/ENGINE?make=Toyota&model=Corolla&year=2018')
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then(resp => {
            assert.include(resp.body, 'L 4-Cyl 1.8 (2ZR-FE) (GAS)');
        })
    });

    it('Should return full vehicle info from api', function() {
        return host_request.get('/api/vehicle/lookup?make=Toyota&model=Sienna&year=2018&engine=LE 6-Cyl 3.5 (2GR-FKS) (GAS)')
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then(resp => {
            const vehicle = resp.body;
            assert.equal(vehicle.year, 2018);
            assert.equal(vehicle.make, 'Toyota');
            assert.equal(vehicle.model, 'Sienna');
            assert.equal(vehicle.engine, 'LE 6-Cyl 3.5 (2GR-FKS) (GAS)');
            assert.equal(vehicle.quarts, 5.8);
        })
    });
});