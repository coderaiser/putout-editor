import {join, dirname} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import gist from './handlers/gist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/v1/gist', gist);

if (process.env.SNIPPET_FILE && process.env.REVISION_FILE) {
    const parse = await('./handlers/parse.js');

    console.log('Serving Parse snippets enabled.');
    app.use('/api/v1/parse', parse);
}

console.log(process.env.STATIC);

if (process.env.STATIC)
    app.use(express.static(new URL(process.env.STATIC, import.meta.url).pathname));

// `next` is needed here to mark this as an error handler
app.use((err, req, res, next) => {
    console.error(new Date().toLocaleString(), err);
    
    if (err.response) {
        res
            .status(err.response.status)
            .send(err.response.statusText);
        return;
    }
    
    res
        .status(500)
        .send('Something went wrong');
});

const {PORT = 8080} = process.env;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}!`);
});
