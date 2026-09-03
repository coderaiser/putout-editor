import {test} from 'supertape';
import {LlmsService} from './llms.service.ts';

test('llms service: llmsTxt returns string', (t) => {
    t.equal(typeof new LlmsService().llmsTxt(), 'string');
    t.end();
});

test('llms service: llmsTxt starts with # putout-editor', (t) => {
    t.ok(new LlmsService().llmsTxt().startsWith('# putout-editor'));
    t.end();
});

test('llms service: llmsTxt contains /api/v1/info', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('/api/v1/info'));
    t.end();
});

test('llms service: llmsTxt contains /api/v1/parse', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('/api/v1/parse'));
    t.end();
});

test('llms service: llmsTxt contains compact query param', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('compact=true'));
    t.end();
});

test('llms service: llmsTxt contains query param', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('query=NodeType'));
    t.end();
});

test('llms service: llmsTxt contains /api/v1/transform', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('/api/v1/transform'));
    t.end();
});

test('llms service: llmsTxt contains /api/v1/find-places', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('/api/v1/find-places'));
    t.end();
});

test('llms service: llmsTxt contains plugin_syntax error kind', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('plugin_syntax'));
    t.end();
});

test('llms service: llmsTxt contains fixture_syntax error kind', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('fixture_syntax'));
    t.end();
});

test('llms service: llmsTxt contains plugin_error kind', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('plugin_error'));
    t.end();
});

test('llms service: llmsTxt workflow mentions find-places', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('find-places'));
    t.end();
});

test('llms service: llmsTxt workflow mentions query step', (t) => {
    t.ok(new LlmsService().llmsTxt().includes('query=VariableDeclaration'));
    t.end();
});

test('llms service: llmsFullTxt includes llmsTxt content', (t) => {
    const service = new LlmsService();
    t.ok(service.llmsFullTxt().includes('# putout-editor'));
    t.end();
});

test('llms service: llmsFullTxt contains replace pattern example', (t) => {
    t.ok(new LlmsService().llmsFullTxt().includes('__x'));
    t.end();
});

test('llms service: llmsFullTxt contains __args template variable', (t) => {
    t.ok(new LlmsService().llmsFullTxt().includes('__args'));
    t.end();
});

test('llms service: llmsFullTxt contains traverse example', (t) => {
    t.ok(new LlmsService().llmsFullTxt().includes('traverse'));
    t.end();
});

test('llms service: llmsFullTxt contains error recovery guide', (t) => {
    t.ok(new LlmsService().llmsFullTxt().includes('Error recovery'));
    t.end();
});

test('llms service: llmsFullTxt mentions empty places recovery', (t) => {
    t.ok(new LlmsService().llmsFullTxt().includes('Empty places'));
    t.end();
});

test('llms service: llmsFullTxt contains query param usage example', (t) => {
    t.ok(new LlmsService().llmsFullTxt().includes('query=VariableDeclaration'));
    t.end();
});

test('llms service: llmsFullTxt contains babel ast explorer link', (t) => {
    t.ok(new LlmsService().llmsFullTxt().includes('astexplorer.net'));
    t.end();
});