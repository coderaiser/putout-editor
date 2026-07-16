import {test} from 'supertape';
import visualizations from './index.js';

test('visualization: index: exports array of visualizations', (t) => {
    t.ok(Array.isArray(visualizations));
    t.end();
});

test('visualization: index: includes 2 visualizations', (t) => {
    t.equal(visualizations.length, 2);
    t.end();
});
