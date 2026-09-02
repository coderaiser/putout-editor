import {test} from 'supertape';
import defaultParserInterface from './defaultParserInterface.js';

test('defaultParserInterface: showInMenu is true', (t) => {
    t.ok(defaultParserInterface.showInMenu);
    t.end();
});

test('defaultParserInterface: _ignoredProperties is empty Set', (t) => {
    const result = defaultParserInterface._ignoredProperties.size;
    
    t.equal(result, 0);
    t.end();
});

test('defaultParserInterface: locationProps is empty Set', (t) => {
    const result = defaultParserInterface.locationProps.size;
    
    t.equal(result, 0);
    t.end();
});

test('defaultParserInterface: typeProps is Set with type', (t) => {
    const result = defaultParserInterface.typeProps.has('type');
    
    t.ok(result);
    t.end();
});

test('defaultParserInterface: opensByDefault returns false', (t) => {
    const result = defaultParserInterface.opensByDefault();
    
    t.notOk(result);
    t.end();
});

test('defaultParserInterface: nodeToRange returns node.range', (t) => {
    const result = defaultParserInterface.nodeToRange({
        range: [1, 5],
    });
    
    const expected = [1, 5];
    
    t.deepEqual(result, expected);
    t.end();
});

test('defaultParserInterface: getNodeName returns node.type', (t) => {
    const result = defaultParserInterface.getNodeName({
        type: 'Program',
    });
    
    t.equal(result, 'Program');
    t.end();
});

test('defaultParserInterface: forEachProperty yields each non-ignored property', (t) => {
    const node = {
        type: 'Program',
        body: [],
    };
    
    const result = [...defaultParserInterface.forEachProperty(node)];
    
    const expected = [{
        value: 'Program',
        key: 'type',
        computed: false,
    }, {
        value: [],
        key: 'body',
        computed: false,
    }];
    
    t.deepEqual(result, expected);
    t.end();
});

test('defaultParserInterface: forEachProperty skips ignored properties', (t) => {
    const node = {
        foo: 1,
        bar: 2,
    };
    
    const result = [...defaultParserInterface.forEachProperty.call({
        _ignoredProperties: new Set(['foo']),
    }, node)];
    
    const expected = [{
        value: 2,
        key: 'bar',
        computed: false,
    }];
    
    t.deepEqual(result, expected);
    t.end();
});

test('defaultParserInterface: _getSettingsConfiguration with keys returns fields', (t) => {
    const result = defaultParserInterface._getSettingsConfiguration({
        option1: true,
        option2: false,
    });
    
    const expected = {
        fields: ['option1', 'option2'],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('defaultParserInterface: _getSettingsConfiguration empty options returns null', (t) => {
    const result = defaultParserInterface._getSettingsConfiguration({});
    
    t.notOk(result);
    t.end();
});

test('defaultParserInterface: hasSettings returns true when default options exist', (t) => {
    const obj = {
        ...defaultParserInterface,
        getDefaultOptions: () => ({
            opt: true,
        }),
    };
    
    const result = obj.hasSettings();
    
    t.ok(result);
    t.end();
});

test('defaultParserInterface: hasSettings returns false when no default options', (t) => {
    const obj = {
        ...defaultParserInterface,
        getDefaultOptions: () => ({}),
    };
    
    const result = obj.hasSettings();
    
    t.notOk(result);
    t.end();
});

test('defaultParserInterface: getDefaultOptions returns empty object', (t) => {
    const result = defaultParserInterface.getDefaultOptions();
    const expected = {};
    
    t.deepEqual(result, expected);
    t.end();
});

test('defaultParserInterface: _mergeDefaultOptions merges current into default', (t) => {
    const result = defaultParserInterface._mergeDefaultOptions({
        opt1: true,
    }, {
        opt1: false,
        opt2: true,
    });
    
    const expected = {
        opt1: true,
        opt2: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('defaultParserInterface: renderSettings returns null when no config', (t) => {
    const obj = {
        ...defaultParserInterface,
        _getSettingsConfiguration() {
            return null;
        },
        getDefaultOptions() {
            return {};
        },
    };
    
    const result = obj.renderSettings(null);
    
    t.notOk(result);
    t.end();
});

test('defaultParserInterface: renderSettings with null settings renders SettingsRenderer', (t) => {
    const obj = {
        ...defaultParserInterface,
        _getSettingsConfiguration() {
            return {
                fields: ['opt1'],
            };
        },
        getDefaultOptions() {
            return {
                opt1: true,
            };
        },
    };
    
    const result = obj.renderSettings(null);
    
    t.ok(result);
    t.end();
});

test('defaultParserInterface: renderSettings with provided settings merges with defaults', (t) => {
    const obj = {
        ...defaultParserInterface,
        _getSettingsConfiguration() {
            return {
                fields: ['opt1', 'opt2'],
            };
        },
        getDefaultOptions() {
            return {
                opt1: false,
                opt2: true,
            };
        },
    };
    
    const result = obj.renderSettings({
        opt1: true,
    });
    
    t.ok(result);
    t.end();
});
