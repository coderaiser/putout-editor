import {test} from 'supertape';
import jestValidate from './jest-validate.js';

test('jest-validate: exports validate function', (t) => {
    const result = typeof jestValidate.validate;
    const expected = 'function';
    
    t.equal(result, expected);
    t.end();
});

test('jest-validate: validate returns undefined (noop)', (t) => {
    const result = jestValidate.validate();
    
    t.notOk(result);
    t.end();
});
