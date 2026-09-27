import {test} from 'supertape';
import {putoutEditor} from './reducers.ts';
import {persist, revive} from './revive.ts';

// `persist` and `revive` live in ./revive.ts, so they are tested here rather than
// in reducers.spec.ts. They used to be re-exported from reducers.ts, which is what
// put them in the wrong file: the re-export is gone, and so is the reason to look
// for them there.
function getInitState() {
    const state = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    return JSON.parse(JSON.stringify(state));
}

test('revive: persist: strips cursor', (t) => {
    const state = {
        ...getInitState(),
        cursor: 5,
    };
    
    const result = persist(state);
    
    t.notOk((result as {
        cursor?: unknown;
    }).cursor);
    t.end();
});

test('revive: persist: strips parseResult', (t) => {
    const state = {
        ...getInitState(),
        workbench: {
            ...getInitState().workbench,
            parseResult: {
                ast: {
                    type: 'Program',
                },
            },
        },
    };
    
    const result = persist(state);
    
    t.notOk((result.workbench as {
        parseResult?: unknown;
    }).parseResult);
    t.end();
});

test('revive: persist: keeps workbench parser', (t) => {
    const state = getInitState();
    const result = persist(state);
    
    t.equal(result.workbench.parser, state.workbench.parser);
    t.end();
});

test('revive: revive: sets initialCode from code', (t) => {
    const state = getInitState();
    const result = revive(state);
    
    t.equal(result.workbench.initialCode, state.workbench.code);
    t.end();
});

test('revive: revive: sets transform.initialCode', (t) => {
    const state = getInitState();
    const result = revive(state);
    
    t.equal(result.workbench.transform.initialCode, state.workbench.transform.code);
    t.end();
});

test('revive: revive: applies parserSettings for current parser', (t) => {
    const state = {
        ...getInitState(),
        parserSettings: {
            babel: {
                plugins: ['jsx'],
            },
        },
    };
    
    const result = revive(state);
    
    t.deepEqual(result.workbench.parserSettings, {
        plugins: ['jsx'],
    });
    t.end();
});

test('revive: revive: uses initialState when undefined', (t) => {
    const result = revive();
    
    t.ok(result);
    t.end();
});
