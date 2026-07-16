import {test} from 'supertape';
import jestValidate from './jest-validate.js';

test('jest-validate: exports validate function', (t) => {
    t.equal(typeof jestValidate.validate, 'function');
    t.end();
});

test('jest-validate: validate returns undefined (noop)', (t) => {
    const result = jestValidate.validate();
    
    t.equal(result, undefined);
    t.end();
});
