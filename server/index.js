'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/v1/gist', require('./handlers/gist'));

if (process.env.SNIPPET_FILE && process.env.REVISION_FILE) {
    console.log('Serving Parse snippets enabled.');
    app.use('/api/v1/parse', require('./handlers/parse'));
}

console.log(process.env.STATIC);

if (process.env.STATIC)
    app.use(express.static(path.join(__dirname, process.env.STATIC)));

// `next` is needed here to mark this as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(new Date().toLocaleString(), err);
    
    if (err.response) {
        res.status(err.response.status).send(err.response.statusText);
        return;
    }
    // eslint-disable-next-line no-console
    res.status(500).send('Something went wrong');
});

const {
    PORT = 8080,
} = process.env;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}!`);
});

