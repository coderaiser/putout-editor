import {test} from 'supertape';
import visualizations from './visualization.js';

test('visualization: index: exports array of visualizations', (t) => {
    const result = Array.isArray(visualizations);
    
    t.ok(result);
    t.end();
});

test('visualization: index: includes 2 visualizations', (t) => {
    t.equal(visualizations.length, 2);
    t.end();
});
