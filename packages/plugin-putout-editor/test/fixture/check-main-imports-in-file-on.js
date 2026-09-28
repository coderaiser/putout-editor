__putout_processor_filesystem([
    '/',
    '/css/',
    ['/css/main.css', `
        @import './tokens.css';
        @import './reset.css';

        .a {
            color: red;
        }
    `],
]);
