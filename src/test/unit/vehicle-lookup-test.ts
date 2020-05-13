export{}
const assert = require('chai').assert
const lookup = require('../../data/vehicle-lookup').VehicleLookup

describe('Vehicle lookup', function() {
    it('Should have years', function() {
        assert.include(lookup.listYears(), 2018);
        assert.include(lookup.listYears('Toyota', 'Corolla'), 2018);
    });

    it('Should have makes', function() {
        assert.include(lookup.listMakes(), 'Toyota');
        assert.include(lookup.listMakes('t'), 'Toyota');
        assert.include(lookup.listMakes(null, 2015), 'Toyota');
        assert.include(lookup.listMakes('to', 2015), 'Toyota');
    });

    it('Should have models', function() {
        assert.include(lookup.listModels('toyot', null, 2016), 'Corolla');
        assert.include(lookup.listModels('toyot', 'c', 2016), 'Corolla');
        assert.include(lookup.listModels('toyot'), 'Corolla');
        assert.include(lookup.listModels('toyot', 'corolla'), 'Corolla');
        assert.include(lookup.listModels('ford', null, 2015), 'F-150');
    });

    it('Should have engines', function() {
        assert.include(lookup.listEngines('toyota', 'sienna', 2018), 'LE 6-Cyl 3.5 (2GR-FKS) (GAS)');
        assert.notInclude(lookup.listEngines('toyota', 'corolla', 2018), 'LE 6-Cyl 3.5 (2GR-FKS) (GAS)');
    });

    it('Should have vehicle info', function() {
        const vehicle = lookup.getVehicleSpecs('toyota', 'sienna', 2018, 'LE 6-Cyl');
        assert.equal(vehicle.year, 2018);
        assert.equal(vehicle.make, 'Toyota');
        assert.equal(vehicle.model, 'Sienna');
        assert.equal(vehicle.engine, 'LE 6-Cyl 3.5 (2GR-FKS) (GAS)');
        assert.equal(vehicle.quarts, 5.8);
    });
});

