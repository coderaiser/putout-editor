import {test} from 'supertape';
import {buildBoundaries} from './boundaries-dsl';

test('buildBoundaries: registers each key as an element with src/ pattern', (t) => {
    const config = buildBoundaries({
        store: [],
        editor: [],
    });
    
    const result = config['boundaries/elements'];
    
    const expected = [{
        type: 'store',
        pattern: 'src/store/**',
    }, {
        type: 'editor',
        pattern: 'src/editor/**',
    }];
    
    t.deepEqual(result, expected);
    t.end();
});

test('buildBoundaries: produces a policy for each key', (t) => {
    const config = buildBoundaries({
        store: ['editor'],
        editor: [],
    });
    
    const [, {policies}] = config['boundaries/dependencies'];
    
    t.equal(policies.length, 2);
    t.end();
});

test('buildBoundaries: policy allow list matches declared targets', (t) => {
    const config = buildBoundaries({
        store: ['editor', 'parser'],
        editor: [],
        parser: [],
    });
    
    const [, {policies}] = config['boundaries/dependencies'];
    const storePolicy = policies.find((p) => p.from.element.type === 'store');
    
    t.deepEqual(storePolicy?.allow, [{
        to: {
            element: {
                type: 'editor',
            },
        },
    }, {
        to: {
            element: {
                type: 'parser',
            },
        },
    }]);
    t.end();
});

test('buildBoundaries: wildcard * passes through as literal', (t) => {
    const config = buildBoundaries({
        app: ['*'],
    });
    
    const [, {policies}] = config['boundaries/dependencies'];
    const [appPolicy] = policies;
    
    t.deepEqual(appPolicy.allow, [{
        to: {
            element: {
                type: '*',
            },
        },
    }]);
    t.end();
});

test('buildBoundaries: glob panel-* expands to all panel- keys', (t) => {
    const config = buildBoundaries({
        'layout': ['panel-*'],
        'panel-source': [],
        'panel-ast': [],
    });
    
    const [, {policies}] = config['boundaries/dependencies'];
    const layoutPolicy = policies.find((p) => p.from.element.type === 'layout');
    
    t.deepEqual(layoutPolicy?.allow, [{
        to: {
            element: {
                type: 'panel-source',
            },
        },
    }, {
        to: {
            element: {
                type: 'panel-ast',
            },
        },
    }]);
    t.end();
});

test('buildBoundaries: glob with no matches keeps literal pattern', (t) => {
    const config = buildBoundaries({
        layout: ['panel-*'],
    });
    
    const [, {policies}] = config['boundaries/dependencies'];
    const [layoutPolicy] = policies;
    
    t.deepEqual(layoutPolicy?.allow, [{
        to: {
            element: {
                type: 'panel-*',
            },
        },
    }]);
    t.end();
});

test('buildBoundaries: empty allow list produces empty policy', (t) => {
    const config = buildBoundaries({
        editor: [],
    });
    
    const [, {policies}] = config['boundaries/dependencies'];
    
    t.deepEqual(policies[0].allow, []);
    t.end();
});

test('buildBoundaries: default is set to disallow', (t) => {
    const config = buildBoundaries({});
    const [, ruleConfig] = config['boundaries/dependencies'];
    
    t.equal(ruleConfig.default, 'disallow');
    t.end();
});
