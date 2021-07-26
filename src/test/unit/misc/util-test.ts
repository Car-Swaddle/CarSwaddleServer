export{}
import { assert } from 'chai';
import { Util } from '../../../util/util';

describe('Util test', function() {
    it('Generated should all be length five', function() {
        assert.equal(Util.generateFiveCharacterReadableID().length, 5);
        assert.equal(Util.generateFiveCharacterReadableID().length, 5);
        assert.equal(Util.generateFiveCharacterReadableID().length, 5);
    });
});
