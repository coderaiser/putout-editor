import {test} from 'supertape';
import {LlmsService} from './llms.service.ts';

test('llms service: llmsTxt returns string', (t) => {
    const result = typeof new LlmsService().llmsTxt();
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('llms service: llmsTxt starts with # putout-editor', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .startsWith('# putout-editor');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains /api/v1/info', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('/api/v1/info');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains /api/v1/parse', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('/api/v1/parse');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains compact query param', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('compact=true');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains query param', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('query=NodeType');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains /api/v1/transform', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('/api/v1/transform');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains /api/v1/find-places', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('/api/v1/find-places');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains plugin_syntax error kind', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('plugin_syntax');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains fixture_syntax error kind', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('fixture_syntax');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt contains plugin_error kind', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('plugin_error');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt workflow mentions find-places', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('find-places');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsTxt workflow mentions query step', (t) => {
    const result = new LlmsService()
        .llmsTxt()
        .includes('query=VariableDeclaration');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt includes llmsTxt content', (t) => {
    const service = new LlmsService();
    const result = service
        .llmsFullTxt()
        .includes('# putout-editor');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt contains replace pattern example', (t) => {
    const result = new LlmsService()
        .llmsFullTxt()
        .includes('__x');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt contains __args template variable', (t) => {
    const result = new LlmsService()
        .llmsFullTxt()
        .includes('__args');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt contains traverse example', (t) => {
    const result = new LlmsService()
        .llmsFullTxt()
        .includes('traverse');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt contains error recovery guide', (t) => {
    const result = new LlmsService()
        .llmsFullTxt()
        .includes('Error recovery');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt mentions empty places recovery', (t) => {
    const result = new LlmsService()
        .llmsFullTxt()
        .includes('Empty places');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt contains query param usage example', (t) => {
    const result = new LlmsService()
        .llmsFullTxt()
        .includes('query=VariableDeclaration');
    
    t.ok(result);
    t.end();
});

test('llms service: llmsFullTxt contains babel ast explorer link', (t) => {
    const result = new LlmsService()
        .llmsFullTxt()
        .includes('astexplorer.net');
    
    t.ok(result);
    t.end();
});
