import {test} from 'supertape';
import {createServer} from './server.ts';

test('server: createServer returns an object', (t) => {
    const server = createServer();
    t.ok(server);
    t.end();
});

test('server: server name is putout-editor', (t) => {
    const server = createServer();
    t.equal(server.server._serverInfo.name, 'putout-editor');
    t.end();
});

test('server: server version is 1.0.0', (t) => {
    const server = createServer();
    t.equal(server.server._serverInfo.version, '1.0.0');
    t.end();
});

test('server: registers docs tool', (t) => {
    const server = createServer();
    t.ok(server._registeredTools['docs']);
    t.end();
});

test('server: registers parse tool', (t) => {
    const server = createServer();
    t.ok(server._registeredTools['parse']);
    t.end();
});

test('server: registers find_places tool', (t) => {
    const server = createServer();
    t.ok(server._registeredTools['find_places']);
    t.end();
});

test('server: registers transform tool', (t) => {
    const server = createServer();
    t.ok(server._registeredTools['transform']);
    t.end();
});

test('server: docs tool has a string description', (t) => {
    const server = createServer();
    t.equal(typeof server._registeredTools['docs'].description, 'string');
    t.end();
});

test('server: parse tool has a string description', (t) => {
    const server = createServer();
    t.equal(typeof server._registeredTools['parse'].description, 'string');
    t.end();
});

test('server: find_places tool has a string description', (t) => {
    const server = createServer();
    t.equal(typeof server._registeredTools['find_places'].description, 'string');
    t.end();
});

test('server: transform tool has a string description', (t) => {
    const server = createServer();
    t.equal(typeof server._registeredTools['transform'].description, 'string');
    t.end();
});
