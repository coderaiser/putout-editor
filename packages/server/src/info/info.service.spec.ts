import {test, stub} from 'supertape';
import {InfoService} from './info.service.ts';

function makeInfoService() {
    const transformService = {
        documentation: stub().returns({
            method: 'PUT',
            url: '/api/v1/transform',
        }),
    };
    const findPlacesService = {
        documentation: stub().returns({
            method: 'PUT',
            url: '/api/v1/find-places',
        }),
    };
    const parseService = {
        documentation: stub().returns({
            method: 'PUT',
            url: '/api/v1/parse',
        }),
    };
    
    return new InfoService(transformService as never, findPlacesService as never, parseService as never);
}

test('info service: name is string', (t) => {
    const result = typeof makeInfoService().info().name;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('info service: description mentions putout', (t) => {
    const result = makeInfoService()
        .info()
        .description
        .includes('Putout');
    
    t.ok(result);
    t.end();
});

test('info service: workflow is array', (t) => {
    const result = Array.isArray(makeInfoService().info().workflow);
    
    t.ok(result);
    t.end();
});

test('info service: workflow has at least 5 steps', (t) => {
    t.ok(makeInfoService().info().workflow.length >= 5);
    t.end();
});

test('info service: workflow mentions find-places', (t) => {
    const result = makeInfoService()
        .info()
        .workflow
        .some((step) => step.includes('find-places'));
    
    t.ok(result);
    t.end();
});

test('info service: workflow mentions query', (t) => {
    const result = makeInfoService()
        .info()
        .workflow
        .some((step) => step.includes('query'));
    
    t.ok(result);
    t.end();
});

test('info service: endpoints.parse exists', (t) => {
    t.ok(makeInfoService().info().endpoints.parse);
    t.end();
});

test('info service: endpoints.transform exists', (t) => {
    t.ok(makeInfoService().info().endpoints.transform);
    t.end();
});

test('info service: endpoints.findPlaces exists', (t) => {
    t.ok(makeInfoService().info().endpoints.findPlaces);
    t.end();
});

test('info service: errorFormat.kinds.plugin_syntax is string', (t) => {
    const result = typeof makeInfoService().info().errorFormat.kinds.plugin_syntax;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('info service: errorFormat.kinds.fixture_syntax is string', (t) => {
    const result = typeof makeInfoService().info().errorFormat.kinds.fixture_syntax;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('info service: errorFormat.kinds.plugin_error is string', (t) => {
    const result = typeof makeInfoService().info().errorFormat.kinds.plugin_error;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('info service: errorFormat.example has kind field', (t) => {
    t.ok(makeInfoService().info().errorFormat.example.kind);
    t.end();
});

test('info service: errorFormat.example has position field', (t) => {
    t.ok(makeInfoService().info().errorFormat.example.position);
    t.end();
});

test('info service: links.putoutScript is string', (t) => {
    const result = typeof makeInfoService().info().links.putoutScript;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('info service: links.babelASTExplorer is string', (t) => {
    const result = typeof makeInfoService().info().links.babelASTExplorer;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('info service: calls transform documentation', (t) => {
    const transformService = {
        documentation: stub().returns({}),
    };
    const findPlacesService = {
        documentation: stub().returns({}),
    };
    const parseService = {
        documentation: stub().returns({}),
    };
    
    const service = new InfoService(transformService as never, findPlacesService as never, parseService as never);
    
    service.info();
    
    t.calledOnce(transformService.documentation);
    t.end();
});

test('info service: calls parse documentation', (t) => {
    const transformService = {
        documentation: stub().returns({}),
    };
    const findPlacesService = {
        documentation: stub().returns({}),
    };
    const parseService = {
        documentation: stub().returns({}),
    };
    
    const service = new InfoService(transformService as never, findPlacesService as never, parseService as never);
    
    service.info();
    
    t.calledOnce(parseService.documentation);
    t.end();
});

test('info service: calls findPlaces documentation', (t) => {
    const transformService = {
        documentation: stub().returns({}),
    };
    const findPlacesService = {
        documentation: stub().returns({}),
    };
    const parseService = {
        documentation: stub().returns({}),
    };
    
    const service = new InfoService(transformService as never, findPlacesService as never, parseService as never);
    
    service.info();
    
    t.calledOnce(findPlacesService.documentation);
    t.end();
});
