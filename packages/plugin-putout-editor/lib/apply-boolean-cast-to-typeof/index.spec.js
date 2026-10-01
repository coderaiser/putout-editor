import {createTest} from '@putout/test';
import * as applyBooleanCastToTypeof from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['apply-boolean-cast-to-typeof', applyBooleanCastToTypeof],
    ],
});

test('putout-editor: apply-boolean-cast-to-typeof: transform', (t) => {
    t.transform('apply-boolean-cast-to-typeof');
    t.end();
});

test('putout-editor: apply-boolean-cast-to-typeof: report', (t) => {
    t.reportCode(`const isObject = (value) => Boolean(value) && typeof value === 'object';`, 'Use the cast form, so the simplification cannot drop the coercion: `a as boolean && typeof a === "object"`');
    t.end();
});

test('putout-editor: apply-boolean-cast-to-typeof: two names is not a guard', (t) => {
    t.noReportCode(`const mismatched = (value) => Boolean(value) && typeof other === 'object';`);
    t.end();
});

test('putout-editor: apply-boolean-cast-to-typeof: a bare logical is left alone', (t) => {
    t.noReportCode(`const notBoolean = (value) => value && typeof value === 'object';`);
    t.end();
});

test('putout-editor: apply-boolean-cast-to-typeof: the cast form is left alone', (t) => {
    t.noReportCode(`const alreadyCast = (value) => value as boolean && typeof value === 'object';`);
    t.end();
});

test('putout-editor: apply-boolean-cast-to-typeof: a non-typeof comparison is left alone', (t) => {
    t.noReportCode(`const unrelated = (value) => Boolean(value) && value === 'object';`);
    t.end();
});
