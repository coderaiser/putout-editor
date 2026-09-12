import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createServer} from './server.ts';

const server = createServer();
const transport = new StdioServerTransport();

await server.connect(transport);
